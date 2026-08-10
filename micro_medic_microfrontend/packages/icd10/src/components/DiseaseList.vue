<script setup lang="ts">
/**
 * The result list, and the component that decides which of the five states the pane is in.
 *
 * Those five are exhaustive and mutually exclusive, which is the point of resolving them here rather
 * than with a handful of independent `v-if`s scattered across the template: initial load, error,
 * empty-because-nothing-matched, empty-because-nothing-is-seeded, and results. Two of them would
 * otherwise be conflated — an empty search result and an empty catalogue look identical in the data
 * and mean completely different things to the doctor, one being "try another word" and the other
 * being "this deployment has no reference data".
 *
 * `mm-spinner`, `mm-empty-state` and `mm-error-state` are the design system's, so this MFE ships no
 * loading or error visuals of its own — one of the clearer payoffs of the shared component layer, and
 * the reason `notifications` gets away with shipping no stylesheet at all.
 */
import type { DiseaseDto } from '@micro-medic/shared-types';
import DiseaseListItem from './DiseaseListItem.vue';

const props = defineProps<{
    diseases: readonly DiseaseDto[];
    selected: DiseaseDto | null;
    term: string;
    isInitialLoading: boolean;
    /** True during a refresh that already has data — dims the list rather than replacing it. */
    isRefreshing: boolean;
    error: string | null;
    isSearching: boolean;
}>();

const emit = defineEmits<{
    select: [disease: DiseaseDto];
    retry: [];
}>();
</script>

<template>
    <!--
        A spinner only when there is nothing to show yet. Once a page has loaded, a refresh keeps the
        rows on screen and dims them — swapping a populated list for a spinner on every keystroke is
        the flicker that makes a search field feel broken. `isInitialLoading` in `useAsyncState`
        exists to make that distinction available here.
    -->
    <mm-spinner v-if="props.isInitialLoading" label="Loading ICD-10 codes" centered />

    <!--
        The error state comes before the empty check on purpose: `useAsyncState` keeps the last good
        data when a request fails, so a failed refresh has both an error and rows. Showing the error
        is the honest ordering — rows that are quietly out of date are worse than rows that are
        labelled as such.
    -->
    <mm-error-state
        v-else-if="props.error"
        heading="Could not load codes"
        :message="props.error"
        retryable
        retry-label="Try again"
        @mm-retry="emit('retry')"
    />

    <mm-empty-state
        v-else-if="props.diseases.length === 0 && props.isSearching"
        heading="No matching codes"
        description="Try a broader term, or search by the code itself."
    />

    <!--
        The other empty: no search term and still nothing. That is not a failed query, it is an
        unseeded database — `icd10_codes.json` loads only from `POST /api/seeder/disease`, which is
        manual and dev-profile-only. Saying so turns a mystifying blank pane into an instruction.
    -->
    <mm-empty-state
        v-else-if="props.diseases.length === 0"
        heading="No codes available"
        description="The ICD-10 catalogue appears to be empty. It is seeded manually via POST /api/seeder/disease."
    />

    <ul
        v-else
        class="icd10__list"
        :class="{ 'icd10__list--refreshing': props.isRefreshing }"
        :aria-busy="props.isRefreshing ? 'true' : 'false'"
    >
        <!--
            Keyed by `code`, which is the entity's actual primary key — `Disease`'s id is the ICD-10
            code itself, not a surrogate number. Keying by array index would be wrong in the way that
            matters here: the list is replaced wholesale on every search, so index keys would let Vue
            reuse a row's DOM for a different code and carry the `aria-current` highlight onto it.
        -->
        <DiseaseListItem
            v-for="disease in props.diseases"
            :key="disease.code"
            :disease="disease"
            :term="props.term"
            :selected="disease.code === props.selected?.code"
            @select="emit('select', $event)"
        />
    </ul>
</template>
