import { css } from 'lit';

export const baseStyles = css`
    :host {
        box-sizing: border-box;
        font-family: var(
            --mm-font-family,
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif
        );
        font-size: var(--mm-font-size, 12px);
        color: var(--mm-font-color, #1a1a2e);
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
`;