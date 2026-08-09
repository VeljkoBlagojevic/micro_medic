import singleSpaHtml from 'single-spa-html';
import axios from 'axios';

// The shared store is consumed as a Module Federation remote. The remote is named
// `shared_store` (see its webpack config) and exposes `./store`, whose shape is
// `{ authStore, eventBus }` — the old `import store from 'store/store'` matched neither the
// remote name nor its exports, so `store.authToken` silently read as undefined.
import { authStore, eventBus } from 'shared_store/store';

import './styles.css';

const API_BASE = 'http://localhost:8080';
const PAGE_SIZE = 10;

/**
 * ICD-10 diagnosis browser — deliberately plain HTML + JavaScript, no framework.
 *
 * It exists to show that a micro-frontend needs nothing but the integration contract:
 * single-spa lifecycles, the shared store, and the `--mm-*` design tokens (usable from any
 * framework because they are just CSS custom properties on `:root`).
 *
 * Its only outward dependency is one published event. It never imports `examination`, and
 * `examination` never imports it — that is the decoupling the pub/sub chapter argues for.
 */

const template = `
  <section class="icd10" aria-labelledby="icd10-heading">
    <h2 id="icd10-heading" class="icd10__heading">ICD-10 diagnoses</h2>
    <label class="mm-sr-only" for="icd10-search">Search diagnoses</label>
    <input
      id="icd10-search"
      class="icd10__search"
      type="search"
      placeholder="Search by code or description…"
      autocomplete="off"
    />
    <p class="icd10__status" role="status" aria-live="polite"></p>
    <ul class="icd10__list"></ul>
  </section>
`;

function debounce(fn, ms) {
    let handle;
    const debounced = (...args) => {
        clearTimeout(handle);
        handle = setTimeout(() => fn(...args), ms);
    };
    debounced.cancel = () => clearTimeout(handle);
    return debounced;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Interpolating API data into `innerHTML` without this would be an injection vector. */
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

async function fetchDiseases(query) {
    const token = authStore.getToken();
    // `GET /api/diseases/**` is `permitAll`, so an anonymous browse works; send the header
    // only when a token exists rather than the literal string "Bearer null".
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const path = query ? '/api/diseases/search' : '/api/diseases';

    const response = await axios.get(`${API_BASE}${path}`, {
        headers,
        params: { size: PAGE_SIZE, ...(query ? { query } : {}) },
    });

    // Collection endpoints return Spring's `Page<T>`, so rows live under `content`. The old
    // code treated the body itself as an array, so `.slice` threw and nothing ever rendered.
    return response.data?.content ?? [];
}

function renderList(root, diseases) {
    const list = root.querySelector('.icd10__list');
    const status = root.querySelector('.icd10__status');

    if (!diseases.length) {
        list.replaceChildren();
        status.textContent = 'No matching diagnoses.';
        return;
    }

    status.textContent = '';
    // `data-code` carries identity only; the click handler looks the DTO back up so the
    // event payload is the real object rather than something re-parsed out of the DOM.
    list.innerHTML = diseases
        .map(
            (disease) => `
        <li class="icd10__item">
          <button class="icd10__option" type="button" data-code="${escapeHtml(disease.code)}">
            <span class="icd10__code">${escapeHtml(disease.code)}</span>
            <span class="icd10__desc">${escapeHtml(disease.description)}</span>
          </button>
        </li>`
        )
        .join('');
}

const htmlParcel = singleSpaHtml({ template });

/**
 * Teardown callbacks for the current mount. single-spa may unmount and remount this
 * application, and a listener left attached would keep firing against a detached node.
 */
let teardown = [];

htmlParcel.originalMount = htmlParcel.mount;
htmlParcel.originalUnmount = htmlParcel.unmount;

htmlParcel.mount = function mount(opts, props) {
    return htmlParcel.originalMount(opts, props).then(async () => {
        const root = document.querySelector('.icd10');
        if (!root) return;

        const status = root.querySelector('.icd10__status');
        const search = root.querySelector('.icd10__search');
        let current = [];

        async function load(query) {
            status.textContent = 'Loading…';
            try {
                current = await fetchDiseases(query);
                renderList(root, current);
            } catch (error) {
                console.error('[icd10] Failed to load diseases:', error);
                current = [];
                root.querySelector('.icd10__list').replaceChildren();
                status.textContent = 'Could not load diagnoses. Is the backend running?';
            }
        }

        const onClick = (event) => {
            const option = event.target.closest('.icd10__option');
            if (!option) return;

            const disease = current.find((item) => item.code === option.dataset.code);
            if (!disease) return;

            root.querySelectorAll('.icd10__option[aria-current]').forEach((el) => {
                el.removeAttribute('aria-current');
            });
            option.setAttribute('aria-current', 'true');

            // Publish and forget. `examination` fills in its diagnosis field from this, but
            // neither application knows the other exists.
            eventBus.emit('ICD10_DISEASE_SELECTED', { disease });
        };

        const onInput = debounce((event) => load(event.target.value.trim()), 300);
        const onAuthChange = () => load(search.value.trim());

        root.addEventListener('click', onClick);
        search.addEventListener('input', onInput);
        // An authenticated browse may differ from the anonymous one, and a list left over
        // from a previous session would be misleading after logout.
        const offLogin = eventBus.on('AUTH_LOGIN', onAuthChange);
        const offLogout = eventBus.on('AUTH_LOGOUT', onAuthChange);

        teardown = [
            () => root.removeEventListener('click', onClick),
            () => {
                onInput.cancel();
                search.removeEventListener('input', onInput);
            },
            offLogin,
            offLogout,
        ];

        await load('');
    });
};

htmlParcel.unmount = function unmount(opts, props) {
    teardown.forEach((off) => off());
    teardown = [];
    return htmlParcel.originalUnmount(opts, props);
};

export const bootstrap = htmlParcel.bootstrap;
export const mount = htmlParcel.mount;
export const unmount = htmlParcel.unmount;
