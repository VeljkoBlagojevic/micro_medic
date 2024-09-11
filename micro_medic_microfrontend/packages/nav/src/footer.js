import React from 'react';
import ReactDOM from 'react-dom';
import singleSpaReact from 'single-spa-react';

const Footer = () => <div className="mui-appbar mui--appbar-line-height">Footer</div>

const footerLifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Footer
});

export const bootstrap = footerLifecycles.bootstrap;
export const mount = footerLifecycles.mount;
export const unmount = footerLifecycles.unmount;
