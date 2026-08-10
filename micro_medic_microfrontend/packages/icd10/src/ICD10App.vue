<script setup lang="ts">
/**
 * Root component: the ICD-10 catalogue pane.
 *
 * It composes four presentational children and owns none of the state they render. The store is
 * created by `ICD10.ts` (or by the harness) and provided to the tree, so this component is the seam
 * between "the application" and "the mount", not a second place where behaviour lives.
 *
 * There is no `phase()` switch of the kind `ExaminationApp` uses, and the difference is real rather
 * than stylistic: recording an examination is genuinely sequential — you cannot write an anamnesis for
 * nobody — so phases make its impossible states unrepresentable. Browsing a catalogue has one state
 * with a search box in it. The list's five display states are resolved inside `DiseaseList`, where
 * the data that distinguishes them already is.
 */
import { useCatalogueStore } from './state/injection-keys.js';
import DiseaseSearchField from './components/DiseaseSearchField.vue';
import DiseaseList from './components/DiseaseList.vue';
import DiseasePager from './components/DiseasePager.vue';
import SelectedDiagnosis from './components/SelectedDiagnosis.vue';

const store = useCatalogueStore();
</script>

<template>
    <!--
        `<section>` with an accessible name, not a bare `<div>`. This pane sits beside another
        micro-frontend on one screen, and a landmark is how a screen-reader user tells the two apart
        and jumps between them — the same reason `nav` sets an explicit `role="banner"` on a custom
        element that has no implicit semantics.

        No width, no grid, no position. The 3:1 geometry is `.mm-split--primary`, applied by the shell
        around the two mount points: a fragment renders into its own mount point and cannot see the
        screen it shares, so a remote claiming a share of the width would be imposing a layout on a
        sibling it cannot observe.
    -->
    <section class="icd10" aria-labelledby="icd10-heading">
        <header class="icd10__header">
            <h2 id="icd10-heading" class="icd10__heading">ICD-10 diagnoses</h2>
            <p class="icd10__hint">Select a code to attach it to the examination.</p>
        </header>

        <DiseaseSearchField
            :value="store.query.value"
            :busy="store.pageState.isLoading.value || store.isTyping.value"
            :result-count="store.totalElements.value"
            @update:value="store.query.value = $event"
            @clear="store.clearQuery()"
        />

        <!--
            Rendered above the list rather than below it. It is the confirmation that the split works,
            and a confirmation the doctor has to scroll a capped, scrollable list to reach is one they
            will not see.
        -->
        <SelectedDiagnosis
            v-if="store.selected.value"
            :disease="store.selected.value"
            @clear="store.clearSelection()"
        />

        <DiseaseList
            :diseases="store.diseases.value"
            :selected="store.selected.value"
            :term="store.query.value"
            :is-initial-loading="store.pageState.isInitialLoading.value"
            :is-refreshing="store.pageState.isLoading.value && !store.pageState.isInitialLoading.value"
            :error="store.pageState.error.value"
            :is-searching="store.isSearching.value"
            @select="store.select($event)"
            @retry="store.retry()"
        />

        <DiseasePager
            :page="store.page.value"
            :total-pages="store.totalPages.value"
            :total-elements="store.totalElements.value"
            :is-first-page="store.isFirstPage.value"
            :is-last-page="store.isLastPage.value"
            :busy="store.pageState.isLoading.value"
            @previous="store.previousPage()"
            @next="store.nextPage()"
        />
    </section>
</template>
