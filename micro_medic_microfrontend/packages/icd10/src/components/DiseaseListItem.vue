<script setup lang="ts">
/**
 * One ICD-10 code in the list.
 *
 * A `<button>`, not a `<div>` with a click handler and not an `<a>`: selecting a code performs an
 * action in this application (it publishes on the bus) rather than navigating anywhere, so the
 * button is both the correct semantics and the reason Enter, Space and focus all work without a
 * `tabindex` or a `keydown` handler.
 *
 * Presentational by construction — it takes a disease and reports a click. It does not know the store
 * exists, does not know what "selected" means beyond a boolean, and above all does not know that a
 * selection is published on an event bus. Which is what lets the whole outbound contract of this MFE
 * live in exactly one function in `catalogue.store.ts`.
 */
import { computed } from 'vue';
import type { DiseaseDto } from '@micro-medic/shared-types';
import { highlightSegments } from '../utils/highlight.js';

const props = defineProps<{
    disease: DiseaseDto;
    selected: boolean;
    /** The active search term, for highlighting. Empty when browsing unfiltered. */
    term: string;
}>();

const emit = defineEmits<{ select: [disease: DiseaseDto] }>();

/*
 * Segments, rendered with `{{ }}`. The alternative — a string of `<mark>` tags through `v-html` —
 * would inject markup built from a backend value; see `utils/highlight.ts` for why that is not worth
 * doing for a visual nicety.
 */
const codeSegments = computed(() => highlightSegments(props.disease.code, props.term));
const descriptionSegments = computed(() =>
    highlightSegments(props.disease.description, props.term)
);
</script>

<template>
    <li>
        <button
            type="button"
            class="icd10__option"
            :aria-current="props.selected ? 'true' : undefined"
            @click="emit('select', props.disease)"
        >
            <!--
                `aria-current` carries the "this is the chosen one" state and is also the styling hook
                (`.icd10__option[aria-current='true']`), so the two cannot disagree — one attribute
                instead of a class that has to be kept in step with it. `undefined` rather than
                `"false"`: `aria-current="false"` is a valid value meaning "not current", but Vue
                drops an `undefined` attribute entirely, which is cleaner in the accessibility tree.
            -->
            <span class="icd10__code">
                <template v-for="(segment, index) in codeSegments" :key="index">
                    <mark v-if="segment.match" class="icd10__match">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                </template>
            </span>
            <span class="icd10__desc">
                <template v-for="(segment, index) in descriptionSegments" :key="index">
                    <mark v-if="segment.match" class="icd10__match">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                </template>
            </span>
        </button>
    </li>
</template>
