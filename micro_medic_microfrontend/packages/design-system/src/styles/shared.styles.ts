import { css } from 'lit';

/**
 * Shared base styles for every `mm-*` element.
 *
 * Every value is a `var(--mm-*, fallback)` so a component still renders correctly when
 * `tokens.css` was not loaded into the host page. Keep the fallbacks in sync with
 * `../tokens.css`.
 */
export const baseStyles = css`
    :host {
        box-sizing: border-box;
        font-family: var(
            --mm-font-family,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            'Open Sans',
            'Helvetica Neue',
            sans-serif
        );
        font-size: var(--mm-font-size-base, 14px);
        line-height: var(--mm-line-height, 1.5);
        color: var(--mm-color-text, #212529);
    }

    :host([hidden]) {
        display: none !important;
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
`;

/**
 * A consistent focus ring. Uses `:focus-visible` so it appears for keyboard navigation
 * without ringing on every mouse click.
 */
export const focusRing = css`
    :where(button, input, textarea, select, a, [tabindex]):focus-visible {
        outline: 2px solid var(--mm-color-accent, #3498db);
        outline-offset: 2px;
    }
`;

/** Visually hidden but still announced by screen readers. */
export const visuallyHidden = css`
    .mm-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
