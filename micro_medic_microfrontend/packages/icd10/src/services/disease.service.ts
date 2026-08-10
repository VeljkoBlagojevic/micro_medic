import { createService } from '@micro-medic/api-client';
import type { DiseaseDto, Page } from '@micro-medic/shared-types';

/**
 * The ICD-10 catalogue, as the backend exposes it.
 *
 * This module is the *only* place in the package that knows a URL, and replacing the previous
 * implementation's hand-rolled HTTP is the debt this rewrite pays off. That version held its own
 * `const API_BASE = 'http://localhost:8080'`, read the token out of the auth store itself and built
 * `{ Authorization: 'Bearer ' + token }` per call. Three consequences, all of which are gone here:
 * the base URL was duplicated in a second place, a 401 did not log the session out because nothing
 * was watching the response, and the header had to be assembled conditionally to avoid literally
 * sending `"Bearer null"`.
 *
 * `createService` routes everything through the one shared axios instance instead. Its request
 * interceptor injects the token when there is one, and its response interceptor normalises every
 * failure to `ApiError` and fires `onUnauthorized` — which `shared-store` wired to `authStore.logout`
 * at import time. The anonymous case still works, and for the same reason it did before:
 * `GET /api/diseases/**` is `permitAll` in `SecurityConfiguration`, so a visitor with no token can
 * browse the catalogue. Now that is a property of the shared client rather than a conditional here.
 */
const diseaseApi = createService('api/diseases');

/**
 * How many codes one page holds.
 *
 * The catalogue is ~71,700 rows, so paging is not a nicety. Ten matches the backend's own
 * `@PageableDefault(size = 10)` — stating it rather than relying on the default keeps this MFE's
 * behaviour from changing if that annotation ever does, and it is the right size for a pane that is
 * one quarter of the screen.
 */
export const PAGE_SIZE = 10;

/**
 * The read side of the catalogue, as an interface rather than only a concrete object.
 *
 * Stated explicitly so the store that consumes it depends on this shape and not on the axios wrapper
 * underneath — which is what makes `createCatalogueStore` drivable by a stub the day this repo grows
 * a test setup, and what keeps the dependency pointing at the abstraction. `CatalogueStoreDeps.catalogue`
 * is typed as this interface for exactly that reason.
 *
 * Two methods, and only two: the backend also exposes `GET /api/diseases/{code}`, but nothing in this
 * package needs it. A pane that already holds the DTO it listed has no reason to re-fetch one code,
 * and an unused third method here would be surface the store is nominally allowed to call and no
 * implementation of this interface could safely omit. Note the shape it would have if a caller ever
 * appears, since it is the one place this domain differs from every other collection in the API:
 * `Disease`'s id is the ICD-10 code itself (`A00.1`), a **string**, not a surrogate number.
 *
 * The two that are here are separate on purpose; see `search` below.
 */
export interface DiseaseCatalogue {
    list(page?: number): Promise<Page<DiseaseDto>>;
    search(query: string, page?: number): Promise<Page<DiseaseDto>>;
}

export const diseaseService: DiseaseCatalogue = {
    /** `GET /api/diseases` — the unfiltered catalogue, one page at a time. */
    list(page = 0): Promise<Page<DiseaseDto>> {
        return diseaseApi.get<Page<DiseaseDto>>('', { page, size: PAGE_SIZE });
    },

    /**
     * `GET /api/diseases/search` — a case-insensitive `LIKE` across code *and* description.
     *
     * Kept distinct from `list` because the backend's JPQL has no null guard: `DiseaseRepository`'s
     * query interpolates the parameter into two `LIKE LOWER(CONCAT('%', :query, '%'))` clauses, so a
     * null or blank `query` is not "match everything" — it is a different query with a different
     * result. `load()` in `state/catalogue.store.ts` therefore routes a blank term to `list`.
     * Encoding that here, in the one module that knows the endpoints, keeps the callers from having
     * to know it.
     */
    search(query: string, page = 0): Promise<Page<DiseaseDto>> {
        return diseaseApi.get<Page<DiseaseDto>>('/search', { query, page, size: PAGE_SIZE });
    },
};
