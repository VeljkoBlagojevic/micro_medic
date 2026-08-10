import './components';

/**
 * Props for the single-spa parcel. `props` are assigned as element **properties**, so arrays
 * and objects (e.g. `mm-table`'s `columns`/`rows`) survive; the old implementation only set
 * attributes and JSON-stringified anything non-scalar, which `mm-table` could never read back.
 */
export interface DesignSystemParcelProps {
    tag: keyof HTMLElementTagNameMap | `mm-${string}`;
    /** Assigned as properties on the element. */
    props?: Record<string, unknown>;
    /** Set as literal attributes. Use for styling hooks like `class`. */
    attrs?: Record<string, string | number | boolean | null | undefined>;
    /** Event name → handler, attached with `addEventListener` and removed on unmount. */
    events?: Record<string, EventListener>;
    /** Text or HTML placed in the element's light DOM (slotted content). */
    textContent?: string;
    domElement?: HTMLElement;
    // single-spa injects its own lifecycle props into a parcel.
    [key: string]: unknown;
}

interface MountRecord {
    element: HTMLElement;
    events: Record<string, EventListener>;
}

const mounted = new WeakMap<HTMLElement, MountRecord>();

function applyAttributes(element: HTMLElement, attrs: DesignSystemParcelProps['attrs'] = {}) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) {
            element.removeAttribute(key);
        } else if (value === true) {
            element.setAttribute(key, '');
        } else {
            element.setAttribute(key, String(value));
        }
    }
}

/**
 * Builds a single-spa parcel that mounts one design-system element. This is the framework-agnostic
 * escape hatch: it lets an MFE with no binding package — the plain-JS shell, or any future remote in
 * a framework nobody has written a wrapper for — render one `mm-*` element inside a tree it does not
 * otherwise control, with no framework-specific code on either side.
 */
export function mountDesignSystemParcel() {
    return {
        bootstrap(): Promise<void> {
            return Promise.resolve();
        },

        async mount(parcelProps: DesignSystemParcelProps): Promise<void> {
            const container = parcelProps.domElement;
            if (!container) {
                throw new Error('mountDesignSystemParcel: props.domElement is required to mount.');
            }
            // Remounting into a container that still holds an element would orphan the old
            // one and leak its listeners.
            if (mounted.has(container)) {
                await this.unmount(parcelProps);
            }

            const element = document.createElement(parcelProps.tag);
            applyAttributes(element, parcelProps.attrs);
            Object.assign(element, parcelProps.props ?? {});
            if (parcelProps.textContent !== undefined) {
                element.textContent = parcelProps.textContent;
            }

            const events = parcelProps.events ?? {};
            for (const [type, handler] of Object.entries(events)) {
                element.addEventListener(type, handler);
            }

            container.appendChild(element);
            mounted.set(container, { element, events });
        },

        unmount(parcelProps: DesignSystemParcelProps): Promise<void> {
            const container = parcelProps.domElement;
            if (!container) {
                throw new Error('mountDesignSystemParcel: props.domElement is required to unmount.');
            }
            const record = mounted.get(container);
            if (record) {
                for (const [type, handler] of Object.entries(record.events)) {
                    record.element.removeEventListener(type, handler);
                }
                record.element.remove();
                mounted.delete(container);
            }
            return Promise.resolve();
        },
    };
}
