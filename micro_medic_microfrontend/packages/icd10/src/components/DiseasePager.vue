<script setup lang="ts">
/**
 * Previous / next across the pages of a result set.
 *
 * Two buttons and a position, not a numbered pager: the unfiltered catalogue is ~71,700 codes, so
 * page 3,417 of 7,170 is a number nobody navigates to on purpose. The search field is how a doctor
 * gets to a specific code; paging is for scanning the neighbours of one they have nearly found.
 *
 * It renders nothing at all for a single page, which is most searches — a pager that is always
 * present but always disabled is two dead controls in the tab order of a pane one quarter of the
 * screen wide.
 */
const props = defineProps<{
    /** Zero-based, matching Spring's `Page.number`. Displayed one-based. */
    page: number;
    totalPages: number;
    totalElements: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    busy?: boolean;
}>();

const emit = defineEmits<{ previous: []; next: [] }>();
</script>

<template>
    <nav v-if="props.totalPages > 1" class="icd10__pager" aria-label="Result pages">
        <mm-button
            variant="tertiary"
            size="sm"
            :disabled="props.isFirstPage || props.busy"
            @click="emit('previous')"
        >
            Previous
        </mm-button>

        <!--
            `role="status"` so the position is announced when it changes: the rows above are replaced
            silently, and without this a screen-reader user pressing Next has no confirmation that
            anything happened. Page numbers are shown one-based because `Page.number` being
            zero-based is an API detail, not something to make the reader translate.
        -->
        <span class="icd10__pager-position" role="status">
            Page {{ props.page + 1 }} of {{ props.totalPages }}
            <span class="icd10__pager-total">({{ props.totalElements }} codes)</span>
        </span>

        <mm-button
            variant="tertiary"
            size="sm"
            :disabled="props.isLastPage || props.busy"
            @click="emit('next')"
        >
            Next
        </mm-button>
    </nav>
</template>
