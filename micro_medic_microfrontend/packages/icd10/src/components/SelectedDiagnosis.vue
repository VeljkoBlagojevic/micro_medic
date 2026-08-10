<script setup lang="ts">
/**
 * The code this pane last published, echoed back to the doctor.
 *
 * Worth its own component for a reason particular to a horizontal split: what this MFE sends is
 * rendered by a *different* micro-frontend, in a different framework, in the pane next door. If the
 * only confirmation of a selection were the highlighted row in a list that may have scrolled, then a
 * doctor whose diagnosis field did not fill in could not tell whether this pane failed to publish or
 * the other failed to receive. Showing what was sent makes the two distinguishable — the boundary
 * becomes observable from both sides.
 *
 * The Clear button is deliberately local and deliberately silent: `DiseaseSelectedPayload.disease` is
 * not nullable, so this bus carries no "deselected" message, and inventing one would change a contract
 * a sibling remote depends on. See `clearSelection` in `catalogue.store.ts`.
 */
import type { DiseaseDto } from '@micro-medic/shared-types';

const props = defineProps<{ disease: DiseaseDto }>();
const emit = defineEmits<{ clear: [] }>();
</script>

<template>
    <section class="icd10__selected" aria-labelledby="icd10-selected-heading">
        <h3 id="icd10-selected-heading" class="icd10__selected-heading">Sent to examination</h3>

        <p class="icd10__selected-body">
            <span class="icd10__code">{{ props.disease.code }}</span>
            <span class="icd10__desc">{{ props.disease.description }}</span>
        </p>

        <mm-button variant="tertiary" size="sm" @click="emit('clear')">Clear</mm-button>
    </section>
</template>
