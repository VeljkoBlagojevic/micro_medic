import React from 'react';
import ReactDOM from 'react-dom';
import singleSpaReact from 'single-spa-react';

const Calendar = () => <div>CALENDAR</div>

const calendarLifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Calendar
});

export const bootstrap = calendarLifecycles.bootstrap;
export const mount = calendarLifecycles.mount;
export const unmount = calendarLifecycles.unmount;
