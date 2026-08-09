import React from 'react';
import singleSpaReact from 'single-spa-react';
import { createRoot } from 'react-dom/client';
import { MmErrorState } from '@micro-medic/design-system-react';
import { AuthApp } from './AuthApp.js';

/**
 * Federated entry point.
 *
 * No `QueryClientProvider` here, unlike `calendar`: this MFE issues three one-shot commands and
 * one small read, none of which has a cache to manage. Adding TanStack Query would mean another
 * shared singleton in the federation scope for no benefit.
 */
const lifecycles = singleSpaReact({
    React,
    ReactDOMClient: { createRoot },
    rootComponent: AuthApp,
    /*
     * The error boundary is the MFE's blast radius. Without it, a throw during render
     * propagates out of single-spa's mount and takes down the shell — and with it every
     * sibling micro-frontend. Failure has to stay inside this box.
     */
    errorBoundary(error) {
        return (
            <MmErrorState
                heading="Sign-in unavailable"
                message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
            />
        );
    },
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
