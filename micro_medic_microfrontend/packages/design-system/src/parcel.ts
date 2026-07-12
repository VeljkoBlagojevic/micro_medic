import './components';

export interface DesignSystemParcelProps {
    tag: keyof HTMLElementTagNameMap;
    attrs?: Record<string, any>;
    domElement?: HTMLElement;
    // single-spa injects additional lifecycle props into the parcel, so we need to allow for any additional props
    [key: string]: any;
}

const mountedElemented = new WeakMap<HTMLElement, HTMLElement>();

function applyAttributes(element: HTMLElement, attrs: Record<string, any> = {}) {
    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else if (typeof value === 'boolean') {
            if (value) {
                element.setAttribute(key, '');
            } else {
                element.removeAttribute(key);
            }
        } else if (typeof value === 'object') {
            element.setAttribute(key, JSON.stringify(value));
        } else {
            element.setAttribute(key, String(value));
        }
    });
}

// Builds a single-spa compatible parcel for the design system, allowing it to be mounted and unmounted in a single-spa application.
export function mountDesignSystemParcel() {
    return {
        bootstrap(): Promise<void> {
            return Promise.resolve();
        },

        mount(props: DesignSystemParcelProps): Promise<void> {
            const container = props.domElement;
            if (!container) {
                return Promise.reject(new Error('No container element provided for mounting the design system parcel.'));
            }
            const el = document.createElement(props.tag);
            applyAttributes(el, props.attrs);
            container.appendChild(el);
            mountedElemented.set(container, el);
            return Promise.resolve();
        },

        unmount(props: DesignSystemParcelProps): Promise<void> {
            const container = props.domElement;
            if (!container) {
                return Promise.reject(new Error('No container element provided for unmounting the design system parcel.'));
            }
            const el = mountedElemented.get(container);
            if (el) {
                container.removeChild(el);
                mountedElemented.delete(container);
            }
            return Promise.resolve();
        }
    }
}