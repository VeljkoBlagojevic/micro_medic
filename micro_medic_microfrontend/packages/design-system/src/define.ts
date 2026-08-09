/**
 * Registers a custom element at most once per page.
 *
 * The custom element registry is per *document*, not per bundle, which makes this the one piece of
 * micro-frontend plumbing every web-component MFE needs. Module Federation shares
 * `@micro-medic/design-system` as a singleton, but a remote that fails to negotiate the shared
 * scope (or a standalone dev server) can still evaluate a component module a second time.
 * `customElements.define` throws `NotSupportedError` on a duplicate tag, which would take down
 * whichever micro-frontend happened to load second, so every component registers through here
 * instead of calling `define` directly.
 *
 * Exported for that reason: `nav` registers `<nav-app-bar>` and `<nav-footer>` through it too. The
 * helper is not about `mm-*` tags — it is about the registry being shared — so a second copy of it
 * per package would be duplication with no upside.
 *
 * The already-registered constructor wins: the first definition is the one the DOM is
 * using, and re-defining is impossible anyway.
 */
export function defineElement(tag: string, ctor: CustomElementConstructor): void {
    const existing = customElements.get(tag);
    if (existing) {
        if (existing !== ctor && typeof console !== 'undefined') {
            console.warn(
                `[design-system] <${tag}> is already registered by a different module instance. ` +
                    `Keeping the first definition — check that the package defining <${tag}> is ` +
                    `shared as a singleton in every webpack remote.`
            );
        }
        return;
    }
    customElements.define(tag, ctor);
}
