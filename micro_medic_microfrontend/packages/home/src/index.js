import { registerApplication, start } from 'single-spa';

// The shell owns the global theme, and loads it exactly once.
//
// `tokens.css` declares the `--mm-*` custom properties on `:root`; `global.css` (which imports
// it) adds the reset, document styles and layout utilities. Both are document-wide, so an MFE
// must not ship them: two remotes each applying their own reset is the classic micro-frontend
// CSS collision, and whichever loads second silently wins. Loading here also means the tokens
// exist before any remote mounts — every `mm-*` component reads them through
// `var(--mm-token, fallback)`, so a missing theme degrades to hardcoded defaults rather than
// breaking, but the fallbacks are not the brand.
import '@micro-medic/design-system/global.css';

registerApplication(
  'icd10',
  () => import('icd10/ICD10'),
  location => location.pathname.startsWith('/')
);

registerApplication(
  'header',
  () => import('nav/Header'),
  location => location.pathname.startsWith('/')
);

registerApplication(
  'footer',
  () => import('nav/Footer'),
  location => location.pathname.startsWith('/')
);

registerApplication(
  'examination',
  () => import('examination/Examination'),
  location => location.pathname.startsWith('/')
);

registerApplication(
  'calendar',
  () => import('calendar/Calendar'),
  location => location.pathname.startsWith('/')
);

start();
