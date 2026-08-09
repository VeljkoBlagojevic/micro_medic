import { authStore } from '@micro-medic/shared-store';
import { Role, type UserDto } from '@micro-medic/shared-types';

// Registers both elements. Order does not matter — each `defineElement` is independent.
import './nav-app-bar.js';
import './nav-footer.js';
import './styles.css';

// The `--mm-*` tokens and the layout utilities the bar leans on (`.mm-appbar`, `.mm-muted`).
// The shell loads these in the real application, so the harness has to do it itself — and this is
// the one place in this package where importing them is correct.
import '@micro-medic/design-system/src/global.css';

/**
 * Standalone dev harness for the `nav` MFE — no shell, no Module Federation, no single-spa.
 *
 * Worth more here than in a feature MFE, because the chrome's entire behaviour is a reaction to
 * things it does not control: auth state changing and the route changing. In the composed
 * application both come from somewhere else, so this page fakes both. It is also the honest test of
 * the framework-agnostic claim: these elements render with nothing but a DOM and a stylesheet.
 *
 * There is no notification control here any more. Toasts live in the `notifications` MFE on :3007,
 * which has a harness of its own — and a chrome harness that could still fire them would be
 * pretending nav has a responsibility it gave away.
 */

const DEMO_USERS: Record<string, UserDto> = {
    doctor: { id: 1, firstname: 'Ana', lastname: 'Marić', email: 'ana@example.org', role: Role.DOCTOR },
    patient: { id: 2, firstname: 'Petar', lastname: 'Jovanović', email: 'petar@example.org', role: Role.PATIENT },
};

/*
 * The elements are placed by markup in `public/index.html`, not created here — that page is the
 * harness's layout, and keeping the composition there mirrors how the shell does it.
 *
 * Route changes are driven by real `pushState` + `popstate`, which is exactly what the bar
 * listens for. `single-spa:routing-event` never fires here (there is no single-spa), and the bar
 * still updates — which is the point of listening to both.
 */
document.querySelectorAll<HTMLElement>('[data-harness-route]').forEach((button) => {
    button.addEventListener('click', () => {
        const path = button.dataset.harnessRoute;
        if (!path) return;
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
});

document.querySelectorAll<HTMLElement>('[data-harness-login]').forEach((button) => {
    button.addEventListener('click', () => {
        const key = button.dataset.harnessLogin ?? 'doctor';
        const user = DEMO_USERS[key];
        if (!user) return;
        // A fake token: nothing here calls the backend, and the store only checks for truthiness.
        authStore.login(`dev-token-${key}`, user);
    });
});

document.querySelector('[data-harness-logout]')?.addEventListener('click', () => {
    authStore.logout();
});
