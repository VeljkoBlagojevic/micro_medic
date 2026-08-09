import * as React from 'react';
import { createComponent as litCreateComponent, type EventName } from '@lit/react';

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
 * `TEvents` **must** default to `{}`, matching `@lit/react`'s own signature. Without the
 * default, omitting `events` makes inference fall back to the bare constraint
 * `Record<string, EventName | string>`, and that index signature matches *every* key: it turns
 * `EventListeners<TEvents>` into a catch-all and makes `@lit/react`'s internal
 * `Omit<…, keyof TEvents>` strip every real prop. The result is that all props — `variant`,
 * `label`, even `children` — silently type as `(e: Event) => void`, so `<MmButton label="Save">`
 * fails to compile while a nonsense event handler passes. Pass `as const` at each call site so
 * the literal keys survive inference.
 *
 * @param tagName    Registered custom element tag.
 * @param elementClass Constructor, used only for its type information.
 * @param events     Map of React prop name → DOM event name. Cast a value with
 *                   `as EventName<MyEvent>` to type that handler's argument precisely.
 */
export function createComponent<
    TElement extends HTMLElement,
    TEvents extends Record<string, EventName | string> = {},
>(tagName: string, elementClass: { new (): TElement; prototype: TElement }, events?: TEvents) {
    return litCreateComponent({
        react: React,
        tagName,
        elementClass,
        events,
    });
}
