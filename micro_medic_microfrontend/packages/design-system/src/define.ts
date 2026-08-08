/**
 * Registers a custom element at most once per page.
 *
 * Module Federation shares `@micro-medic/design-system` as a singleton, but a remote that
 * fails to negotiate the shared scope (or a standalone dev server) can still evaluate this
 * package a second time. `customElements.define` throws `NotSupportedError` on a duplicate
 * tag, which would take down whichever micro-frontend happened to load second, so every
 * component registers through here instead of calling `define` directly.
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
                    `Keeping the first definition — check that "@micro-medic/design-system" is ` +
                    `shared as a singleton in every webpack remote.`
            );
        }
        return;
    }
    customElements.define(tag, ctor);
}
