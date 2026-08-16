import { NAV_SIGN_OUT_EVENT, Role, type UserDto } from '@micro-medic/shared-types';
import { toAttributes, type SessionSnapshot } from './session-attributes.js';

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
 * things it does not control: the session and the route. In the composed application both come from
 * somewhere else, so this page plays that part itself.
 *
 * And it plays it *the same way the shell does*, which is what makes the harness evidence rather than
 * a lookalike. It holds a session object, projects it with the same `toAttributes` the federated mount
 * uses, and listens for `nav:sign-out` — no store, no bus, no adapter. That the chrome is fully
 * drivable from thirty lines of plain DOM code is the strongest available statement of what
 * "attributes in, events out" buys.
 *
 * There is no notification control here any more. Toasts live in the `notifications` MFE on :3007,
 * which has a harness of its own — and a chrome harness that could still fire them would be
 * pretending nav has a responsibility it gave away.
 */

const DEMO_USERS: Record<string, UserDto> = {
    doctor: { id: 1, firstname: 'Ana', lastname: 'Marić', email: 'ana@example.org', role: Role.DOCTOR },
    patient: { id: 2, firstname: 'Petar', lastname: 'Jovanović', email: 'petar@example.org', role: Role.PATIENT },
};

const SIGNED_OUT: SessionSnapshot = { isAuthenticated: false, user: null, role: null };

let session: SessionSnapshot = SIGNED_OUT;

/**
 * The host's whole job: write the projected attributes onto the element.
 *
 * Four lines, and no shared code with the element beyond three attribute names — which is the same
 * work `createCustomElementLifecycles` does in the composed application.
 */
function applySession(): void {
    const attributes = Object.entries(toAttributes(session));
    document.querySelectorAll('nav-app-bar').forEach((bar) => {
        attributes.forEach(([name, value]) => {
            if (value === null) bar.removeAttribute(name);
            else bar.setAttribute(name, value);
        });
    });
}

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
        const user = DEMO_USERS[button.dataset.harnessLogin ?? 'doctor'];
        if (!user) return;
        session = { isAuthenticated: true, user, role: user.role };
        applySession();
    });
});

/*
 * Answering the bar's own event, which is the half a harness usually cannot exercise: the button in
 * the bar does not sign anyone out, it asks its host to. Here that lands on the same listener shape
 * the shell uses, so a broken event surfaces at :3003 rather than only in the composed app.
 */
window.addEventListener(NAV_SIGN_OUT_EVENT, () => {
    session = SIGNED_OUT;
    applySession();
});

applySession();
