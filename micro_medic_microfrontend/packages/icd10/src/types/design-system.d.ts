/**
 * Typed `mm-*` tags for `vue-tsc`, and the whole of what Vue needs to consume the design system.
 *
 * This file is the answer to "which framework needs a binding package?". `design-system-react` is
 * ~30 lines of `@lit/react` wrappers plus a load-bearing generic default, because JSX has no prop for
 * a custom event — `mm-close` otherwise needs a `useRef` + `addEventListener` per element. (React ≤18
 * also stringified an unknown JSX prop onto an attribute, turning `rows={[…]}` into
 * `"[object Object]"`; React 19 assigns to a matching instance property first, so that half of the
 * argument is historical.) `design-system-angular` is eleven directives extending a generic base,
 * because the alternative — `CUSTOM_ELEMENTS_SCHEMA` — switches template checking off for every
 * unknown tag in the component, not just the intended one.
 *
 * Vue 3 has neither defect. A binding to an unknown element whose value is not a string is set as a
 * DOM **property**, and `@mm-input` is registered with `addEventListener`, so `<mm-select :options>`
 * and `@mm-change` work with no adapter at all. What remains is purely a type-checking concern, and
 * it is declarative: `GlobalComponents` tells `vue-tsc` what each tag accepts, so a misspelled
 * `heading` or a `:rows="'3'"` is a build error rather than a silent no-op at runtime.
 *
 * **Why here and not in `@micro-medic/design-system`.** That package is framework-agnostic by
 * design — it depends on `lit` and nothing else, which is what lets React, Angular, Vue and two
 * plain-custom-element MFEs all consume it. A `GlobalComponents` interface there would make it
 * depend on `vue`'s types, so every consumer would pay for a framework only one of them uses. The
 * `HTMLElementTagNameMap` declarations *do* belong there, because that is a platform type.
 *
 * The declarations mirror each component's `static properties`. Attribute-cased names appear where
 * Lit maps them (`retryLabel` → `retry-label`): Vue templates set the *attribute* spelling for a
 * string, and the property spelling also works, so both are listed where they differ.
 */

import type { DiseaseDto } from '@micro-medic/shared-types';

/** `detail` of `mm-input` / `mm-change` / `mm-blur`, from `mm-input.ts`'s `emit`. */
export interface MmInputEventDetail {
    value: string;
    name: string;
}

declare module 'vue' {
    interface GlobalComponents {
        'mm-button': {
            variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';
            size?: 'sm' | 'md' | 'lg';
            disabled?: boolean;
            loading?: boolean;
            type?: 'button' | 'submit' | 'reset';
            'full-width'?: boolean;
            label?: string;
        };
        'mm-input': {
            label?: string;
            name?: string;
            type?: string;
            value?: string;
            placeholder?: string;
            error?: string;
            hint?: string;
            disabled?: boolean;
            readonly?: boolean;
            required?: boolean;
            multiline?: boolean;
            rows?: number;
            autocomplete?: string;
            /**
             * Composed and bubbling, so it crosses the shadow boundary and Vue's listener on the
             * host sees it. `blur` alone does not bubble, which is why the component re-emits it as
             * `mm-blur` — see the comment on `onBlur` in `mm-input.ts`.
             */
            onMmInput?: (event: CustomEvent<MmInputEventDetail>) => void;
            onMmChange?: (event: CustomEvent<MmInputEventDetail>) => void;
            onMmBlur?: (event: CustomEvent<MmInputEventDetail>) => void;
        };
        'mm-spinner': {
            size?: 'sm' | 'md' | 'lg';
            label?: string;
            centered?: boolean;
            'hide-label'?: boolean;
        };
        'mm-empty-state': {
            heading?: string;
            description?: string;
            icon?: string;
        };
        'mm-error-state': {
            heading?: string;
            description?: string;
            /** Alias of `description`; both exist on the element. */
            message?: string;
            retryable?: boolean;
            'retry-label'?: string;
            onMmRetry?: (event: CustomEvent<void>) => void;
        };
        'mm-card': {
            heading?: string;
            clickable?: boolean;
            onMmCardClick?: (event: CustomEvent<void>) => void;
        };
    }
}

/**
 * Re-exported so a component can name the payload it publishes without importing from
 * `shared-types` twice. The bus contract itself lives in `shared-types/src/events.ts`; this is
 * only convenience.
 */
export type { DiseaseDto };
