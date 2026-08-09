import { defineElement } from '@micro-medic/design-system';
import { ReactiveElement } from './reactive-element.js';

/**
 * The page footer.
 *
 * Exposed as a second single-spa application from the *same* package, which is a deliberate
 * choice about deployment granularity. The header and footer are one team's concern and always
 * change together, so splitting them into two remotes would add a deployable without adding any
 * independence — the cost of a micro-frontend is paid per *repository and pipeline*, not per
 * component. They are two single-spa applications only because the shell mounts them at opposite
 * ends of the document, which is a layout fact, not an ownership one.
 *
 * It extends `ReactiveElement` even though it has no state. The base class is where "render into
 * light DOM, tear down on disconnect" lives, and inheriting a no-op `subscribe()` costs nothing;
 * hand-rolling a `connectedCallback` here would make the two chrome elements differ for no
 * reason.
 */
export class NavFooter extends ReactiveElement {
    constructor() {
        super();
        // See the note in `nav-app-bar.ts`: a custom element has neither layout nor semantics of
        // its own, so both are set explicitly. `contentinfo` is what `<footer>` would have implied.
        this.classList.add('nav-footer');
        this.setAttribute('role', 'contentinfo');
    }

    protected render(): string {
        return `
            <span>MicroMedic — micro-frontend reference implementation</span>
            <span class="mm-muted">single-spa · Module Federation · native web components</span>
        `;
    }
}

defineElement('nav-footer', NavFooter);

declare global {
    interface HTMLElementTagNameMap {
        'nav-footer': NavFooter;
    }
}
