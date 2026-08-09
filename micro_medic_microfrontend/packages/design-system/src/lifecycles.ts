/**
 * Turns a custom element into a single-spa application.
 *
 * This is the whole framework adapter for a web-component micro-frontend — a few dozen lines,
 * because the element already *is* the component. `single-spa-react`, `single-spa-vue` and friends
 * exist to translate between a framework's own mount/unmount and single-spa's; a custom element's
 * `connectedCallback`/`disconnectedCallback` are already that contract, so all this has to do is put
 * the element into the DOM and take it out again.
 *
 * It lives in the design system rather than in one MFE because two of them need it — `nav` mounts
 * `<nav-app-bar>` and `<nav-footer>` with it, `notifications` mounts `<notification-center>` — and
 * because it is the counterpart of `mountDesignSystemParcel`: together they are this package's
 * answer to "how does a custom element take part in the composition", one as an application and one
 * as a parcel. Note that it imports nothing from `single-spa`: the lifecycle contract is three
 * promise-returning functions, and typing the props structurally is what lets this be used by the
 * shell's single-spa 5 and the feature MFEs' 6 alike (see the note about not sharing single-spa in
 * `home/webpack.config.js`).
 *
 * `single-spa-html` (which `icd10` uses) would also work, and this deliberately does not use it:
 *
 *   - it mounts by assigning `innerHTML`, which means unmounting is `innerHTML = ''`. Appending and
 *     removing a node is the same effect without re-parsing a string, and it keeps a reference to
 *     the exact element we created rather than trusting the container to hold only ours;
 *   - it ships no type declarations, so consuming it from TypeScript needs an ambient `declare
 *     module` whose accuracy nothing checks;
 *   - the adapter it saves is this file.
 *
 * `icd10` keeps using it on purpose, so the repo shows both: the library route for a plain-HTML
 * fragment, and the hand-rolled route where the fragment is a custom element.
 */

/**
 * The subset of single-spa's props this adapter reads.
 *
 * Declared here rather than imported from `single-spa`: the only thing needed is the shape of a few
 * optional fields, and a structural type cannot go stale across the v5/v6 split the way an import
 * can.
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
}

export interface CustomElementLifecycles {
    bootstrap: (props: CustomElementMountProps) => Promise<void>;
    mount: (props: CustomElementMountProps) => Promise<void>;
    unmount: (props: CustomElementMountProps) => Promise<void>;
}

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
 * Builds single-spa lifecycles that mount one instance of `tag`.
 *
 * The element must already be registered — pass a tag whose module has been imported, since
 * registration is an import side effect throughout this repo.
 */
export function createCustomElementLifecycles(tag: string): CustomElementLifecycles {
    /*
     * Keyed by container rather than held in a single slot. single-spa serialises an application's
     * own mount/unmount, so one slot would usually do — but the same lifecycles can legitimately be
     * mounted as several parcels into different containers at once, and then a single slot would
     * leak every element but the last.
     */
    const mounted = new Map<HTMLElement, HTMLElement>();

    return {
        bootstrap(): Promise<void> {
            // Nothing to do: importing the element's module already registered it. Kept because
            // single-spa requires the export to exist.
            return Promise.resolve();
        },

        mount(props: CustomElementMountProps): Promise<void> {
            const container = resolveContainer(props, tag);
            const element = document.createElement(tag);
            mounted.set(container, element);
            // Appending is what runs `connectedCallback`, which is where the element renders and
            // subscribes. Nothing else to trigger.
            container.appendChild(element);
            return Promise.resolve();
        },

        unmount(props: CustomElementMountProps): Promise<void> {
            const container = resolveContainer(props, tag);
            const element = mounted.get(container);
            mounted.delete(container);
            // `remove()` runs `disconnectedCallback`, which is where the subscriptions are torn
            // down. Skipping it is what would leak a store subscription per mount.
            element?.remove();
            return Promise.resolve();
        },
    };
}
