import type React from 'react';

type MmElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, any>;

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            [tagName: `mm-${string}`]: MmElementProps;
        }
    }
}

declare module 'react/jsx-runtime' {
    namespace JSX {
        interface IntrinsicElements {
            [tagName: `mm-${string}`]: MmElementProps;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [tagName: `mm-${string}`]: HTMLElement;
    }
}

export {};