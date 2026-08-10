<script setup lang="ts">
/**
 * The search box.
 *
 * `<mm-input>` from the design system rather than a bare `<input>`, which is the change of substance
 * from the previous implementation: that one styled its own `.icd10__search`, so the field beside the
 * Angular form was a lookalike that would drift on the first theme change. A control rendered from
 * the same Lit element as every other field in the application cannot drift.
 *
 * And it needs no binding layer to do it. `@mm-input` is a plain `addEventListener` in Vue and
 * `:value` is set as a property, so this is the whole integration — no `design-system-vue`, no
 * `CUSTOM_ELEMENTS_SCHEMA` equivalent, one `isCustomElement` predicate in the build. The
 * `GlobalComponents` declarations in `src/types/design-system.d.ts` are what make `vue-tsc` check the
 * bindings, so a misspelled `placehodler` fails the build rather than doing nothing at runtime.
 */
import type { MmInputEventDetail } from '../types/design-system';

const props = defineProps<{
    /** The live value, *not* the debounced one — the field must echo keystrokes immediately. */
    value: string;
    /** True while a request is in flight or one is pending behind the debounce. */
    busy?: boolean;
    resultCount: number;
}>();

const emit = defineEmits<{
    'update:value': [value: string];
    clear: [];
}>();

/**
 * `detail.value`, not `(event.target as HTMLInputElement).value`.
 *
 * The target is the `<mm-input>` host, not the `<input>` inside its shadow root — a composed event
 * crossing out of a shadow tree is retargeted to the host — so reading `.value` off the target reads
 * the custom element's own property. That happens to hold the right string, but only because the
 * component keeps it in sync; `detail` is what the component actually promises.
 */
function onInput(event: CustomEvent<MmInputEventDetail>): void {
    emit('update:value', event.detail.value);
}
</script>

<template>
    <div class="icd10__search">
        <!--
            No `<form>` and no submit button: the search is live, so there is nothing to submit.
            `type="search"` rather than `text` so mobile keyboards show a search key.
        -->
        <mm-input
            name="icd10-query"
            type="search"
            label="Search ICD-10"
            placeholder="Code or description — J06, bronchitis"
            autocomplete="off"
            :value="props.value"
            @mm-input="onInput"
        />

        <!--
            `role="status"` makes this a polite live region, so a screen reader hears the result count
            change without the announcement interrupting typing. It is the only feedback a non-sighted
            user gets that a search happened: the list below is long, and its first row changing is
            not something assistive technology announces on its own.
        -->
        <p class="icd10__status" role="status">
            <template v-if="props.busy">Searching…</template>
            <template v-else-if="props.value">
                {{ props.resultCount }} {{ props.resultCount === 1 ? 'match' : 'matches' }}
            </template>
        </p>

        <!--
            Outside the live region: a button inside `role="status"` would be re-announced every time
            the count changed. `v-if` rather than `disabled` because there is nothing to clear when the
            field is empty, and a permanently dead control is noise in the tab order.
        -->
        <button v-if="props.value" type="button" class="icd10__clear" @click="emit('clear')">
            Clear search
        </button>
    </div>
</template>
