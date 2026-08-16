/**
 * Turns a custom element into a single-spa application.
 *
 * This is the whole framework adapter for a web-component micro-frontend — a few dozen lines,
 * because the element already *is* the component. `single-spa-react`, `single-spa-vue` and friends
 * exist to translate between a framework's own mount/unmount and single-spa's; a custom element's
 * `connectedCallback`/`disconnectedCallback` are already that contract, so all this has to do is put
 * the element into the DOM and take it out again — plus the one thing single-spa's contract has no
 * equivalent for: projecting the host's `customProps` onto the element as **attributes**, which is
 * parent-to-fragment communication in Geers §6.1.1 and a custom element's native way to receive input.
 *
 * It lives in the design system rather than in one MFE because two of them need it — `nav` mounts
 * `<nav-app-bar>` and `<nav-footer>` with it, `notifications` mounts `<notification-center>`. Note
 * that it imports nothing from `single-spa`: the lifecycle contract is three promise-returning
 * functions, and typing the props structurally rather than importing single-spa's own type is what
 * keeps this adapter decoupled from whichever single-spa major is actually running — a structural
 * type cannot go stale against a version bump the way an import can, even though `home`, `auth` and
 * `calendar` all share one version of it today (see `home/webpack.config.js`).
 *
 * `single-spa-html` would also work, and this deliberately does not use it:
 *
 *   - it mounts by assigning `innerHTML`, which means unmounting is `innerHTML = ''`. Appending and
 *     removing a node is the same effect without re-parsing a string, and it keeps a reference to
 *     the exact element we created rather than trusting the container to hold only ours;
 *   - it ships no type declarations, so consuming it from TypeScript needs an ambient `declare
 *     module` whose accuracy nothing checks;
 *   - the adapter it saves is this file.
 *
 * No package in the monorepo depends on it: every MFE writes its own three functions, which shows what
 * the framework adapters actually do.
 */

/**
 * The subset of single-spa's props this adapter reads.
 *
 * Declared here rather than imported from `single-spa`: the only thing needed is the shape of a few
 * optional fields, and a structural type cannot go stale against whichever single-spa major is
 * actually running the way an import can.
 */
export interface CustomElementMountProps {
    /** Set by single-spa to the registered application name. */
    name?: string;
    /** Older single-spa versions and some parcels use this instead. */
    appName?: string;
    /** Set when mounted as a parcel: mount straight into this node. */
    domElement?: HTMLElement;
    /** A caller-supplied container resolver, which wins over the default one. */
    domElementGetter?: () => HTMLElement | null;
    /**
     * Whatever the shell passed as `customProps` at registration — single-spa merges it into the same
     * object. Typed `unknown` because this package cannot know what a host chooses to pass, which is
     * also why a projector has to narrow it before use.
     */
    [key: string]: unknown;
}

export interface CustomElementLifecycles {
    bootstrap: (props: CustomElementMountProps) => Promise<void>;
    mount: (props: CustomElementMountProps) => Promise<void>;
    unmount: (props: CustomElementMountProps) => Promise<void>;
}

/** Attribute values to project onto the element. `null` removes the attribute. */
export type AttributeMap = Record<string, string | null>;

/**
 * Context from the parent, readable now and again whenever it changes.
 *
 * `subscribe` rather than a plain map because `customProps` are fixed at registration while the
 * context behind them is not: single-spa hands the same object to every mount, so a one-shot read
 * would give the fragment the state at mount time and never correct it.
 *
 * The listener takes no argument on purpose — the adapter re-reads `get()`, so the projection from
 * context to attributes lives in exactly one place instead of once per path.
 */
export interface AttributeSource {
    get(): AttributeMap;
    subscribe(onChange: () => void): () => void;
}

/**
 * Turns mount props into an attribute source, or `null` for "this host passed nothing".
 *
 * This is the seam that keeps the design system domain-free. Parent-to-fragment context is Geers
 * §6.1.1 — the parent sets attributes, the child observes them — but *what* the context is stays with
 * the fragment: `nav` knows a session has a user name and a role, and this package's only dependency
 * is `lit`. So the host supplies the projection and the adapter only applies it.
 *
 * Returning `null` is a supported outcome, not a failure. A fragment must still render when mounted
 * by a host that passes no props at all — its own dev harness, most obviously — so the element's
 * no-attributes state has to be a real state rather than a broken one.
 */
export type AttributeProjector = (props: CustomElementMountProps) => AttributeSource | null;

/**
 * Resolves the container to mount into, following single-spa's own precedence.
 *
 * The default — `#single-spa-application:<name>` — is the convention the shell's
 * `public/index.html` already declares a `<div>` for. Creating one on demand when it is missing
 * matches what single-spa does, and matters: a missing mount point would otherwise mean the
 * fragment silently does not render, which looks like a broken remote rather than a missing div.
 */
function resolveContainer(props: CustomElementMountProps, tag: string): HTMLElement {
    if (props.domElement) return props.domElement;

    const fromProps = props.domElementGetter?.();
    if (fromProps) return fromProps;

    const name = props.name ?? props.appName;
    if (!name) {
        throw new Error(
            `[design-system] Cannot resolve a mount point for <${tag}>: single-spa passed neither a ` +
                `name nor a domElement.`
        );
    }

    const id = `single-spa-application:${name}`;
    const existing = document.getElementById(id);
    if (existing) return existing;

    const created = document.createElement('div');
    created.id = id;
    document.body.appendChild(created);
    return created;
}

/**
 * Writes an attribute map onto the element.
 *
 * The `getAttribute` comparison is not a micro-optimisation: `setAttribute` runs
 * `attributeChangedCallback` even when the value is unchanged, so without it every context change
 * would re-render the element once per projected attribute rather than once.
 */
function applyAttributes(element: HTMLElement, attributes: AttributeMap): void {
    Object.entries(attributes).forEach(([name, value]) => {
        if (value === null) element.removeAttribute(name);
        else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    });
}

/**
 * Builds single-spa lifecycles that mount one instance of `tag`.
 *
 * The element must already be registered — pass a tag whose module has been imported, since
 * registration is an import side effect throughout this repo.
 *
 * `projectAttributes` is optional, and passing one is what makes the fragment a child in Geers's
 * §6.1.1 sense: the host's context arrives as attributes, which is a custom element's *native* input
 * mechanism, so the fragment needs no import to read it and no framework to observe it. That is the
 * decoupling — a fragment configured through attributes can be mounted by a host that shares no code
 * with it at all, whereas one that imports a shared store is bound to that store's module identity.
 */
export function createCustomElementLifecycles(tag: string, projectAttributes?: AttributeProjector): CustomElementLifecycles {
    /*
     * Keyed by container rather than held in a single slot. single-spa serialises an application's
     * own mount/unmount, so one slot would usually do — but the same lifecycles can legitimately be
     * mounted as several parcels into different containers at once, and then a single slot would
     * leak every element but the last.
     */
    const mounted = new Map<HTMLElement, { element: HTMLElement; unsubscribe?: () => void }>();

    return {
        bootstrap(): Promise<void> {
            // Nothing to do: importing the element's module already registered it. Kept because
            // single-spa requires the export to exist.
            return Promise.resolve();
        },

        mount(props: CustomElementMountProps): Promise<void> {
            const container = resolveContainer(props, tag);
            const element = document.createElement(tag);

            const source = projectAttributes?.(props) ?? null;
            /*
             * Before insertion, deliberately. `attributeChangedCallback` fires on a disconnected
             * element, so the element's *first* render already has the host's context — rather than
             * rendering signed-out and correcting itself a frame later, which is a visible flicker in
             * a fragment that is on screen from first paint.
             */
            if (source) applyAttributes(element, source.get());

            const unsubscribe = source?.subscribe(() => applyAttributes(element, source.get()));
            mounted.set(container, { element, unsubscribe });

            // Appending is what runs `connectedCallback`, which is where the element renders and
            // subscribes. Nothing else to trigger.
            container.appendChild(element);
            return Promise.resolve();
        },

        unmount(props: CustomElementMountProps): Promise<void> {
            const container = resolveContainer(props, tag);
            const entry = mounted.get(container);
            mounted.delete(container);
            // Unsubscribe first: the projection closes over the element, so a context change arriving
            // after removal would write attributes onto a detached node.
            entry?.unsubscribe?.();
            // `remove()` runs `disconnectedCallback`, which is where the element's own listeners are
            // torn down. Skipping it is what would leak a subscription per mount.
            entry?.element.remove();
            return Promise.resolve();
        },
    };
}
