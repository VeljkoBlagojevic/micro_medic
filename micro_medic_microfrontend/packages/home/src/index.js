import { registerApplication, start } from 'single-spa';

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

registerApplication(
  'login',
  () => import('login/Login'),
  location => location.pathname.startsWith('/')
);

start();
