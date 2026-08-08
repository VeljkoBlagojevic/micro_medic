import * as React from 'react';
import { createComponent as litCreateComponent } from '@lit/react';

/**
 * Thin seam over `@lit/react`'s `createComponent` so every wrapper in this package is built
 * the same way and `React` is threaded in from one place.
 *
 * Why a wrapper package at all: React (through v19) sets unknown JSX props on a custom
 * element as **attributes**, stringifying them. That is fine for `variant="primary"` but
 * breaks for anything non-scalar — an array of table columns becomes `"[object Object]"`,
 * and `open={false}` becomes the string `"false"`, which is truthy as an attribute. React
 * also cannot subscribe to custom events (`mm-close`), since `onMm-close` is not a thing.
 *
 * `@lit/react` solves both: it assigns declared fields as **properties** and maps event
 * names to React-style callback props via `addEventListener`.
 *
 * @param tagName    Registered custom element tag.
 * @param elementClass Constructor, used only for its type information.
 * @param events     Map of React prop name → DOM event name.
 */
export function createComponent<
    TElement extends HTMLElement,
    TEvents extends Record<string, string>,
>(tagName: string, elementClass: { new (): TElement; prototype: TElement }, events?: TEvents) {
    return litCreateComponent({
        react: React,
        tagName,
        elementClass,
        events,
    });
}
