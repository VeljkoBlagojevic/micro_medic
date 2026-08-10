import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { authStore, type AuthState } from '@micro-medic/shared-store';
import { Role } from '@micro-medic/shared-types';

/**
 * Angular's view of the cross-micro-frontend auth store.
 *
 * The shared store is deliberately framework-free — a closure over module state with a
 * `subscribe(cb)` that returns its own teardown — so each framework brings its own bridge:
 * `calendar` uses `useState` + `subscribe` (`state/useAuthState.ts`), and this is the Angular
 * equivalent. The signal is the *only* copy of the state in this package; nothing else may cache
 * a token or a role, or the two would drift on logout.
 *
 * Not `providedIn: 'root'` by accident — it must be a singleton *within this MFE's* injector so
 * every component sees one subscription. It is not shared across MFEs; the thing that is shared is
 * the store underneath it.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
    private readonly state = signal<AuthState>(authStore.getState());

    readonly user = computed(() => this.state().user);
    readonly role = computed(() => this.state().role);
    readonly isAuthenticated = computed(() => this.state().isAuthenticated);

    /**
     * Recording an examination is `ROLE_DOCTOR`-only at three layers: the URL matcher on
     * `POST /api/examinations/**`, `@PreAuthorize` on `ExaminationService.examine`, and
     * `AccessGuard`'s row-level check.
     *
     * This flag drives what the UI *offers*, and is presentation only — exactly like `roles` in
     * nav's `nav-links.ts`. It is not authorisation, and must never be treated as such: the
     * backend re-decides on every request, and a patient who reached this screen by typing the URL
     * gets a 403 regardless of what is rendered.
     */
    readonly isDoctor = computed(() => this.state().role === Role.DOCTOR);

    readonly displayName = computed(() => {
        const user = this.state().user;
        return user ? `${user.firstname} ${user.lastname}`.trim() : null;
    });

    constructor() {
        // `subscribe` returns its own teardown, and `DestroyRef` is what guarantees it runs. A
        // leaked subscription here would keep a destroyed injector's signal alive and writing —
        // the Angular analogue of the double-subscription bug `nav` and `notifications` guard
        // against in `connectedCallback`.
        const unsubscribe = authStore.subscribe((next) => this.state.set(next));
        inject(DestroyRef).onDestroy(unsubscribe);
    }
}
