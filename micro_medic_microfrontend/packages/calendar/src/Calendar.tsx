import React from "react";
import singleSpaReact from "single-spa-react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MmErrorState } from "@micro-medic/design-system-react";
import { CalendarApp } from "./CalendarApp";

/**
 * Federated entry point.
 *
 * The QueryClient is constructed here, once per module evaluation. It used to be
 * `useQueryClient()` at module scope — a hook called outside a component, which throws
 * immediately on import and took the whole remote down. `useQueryClient` also reads from
 * context, so it could never have supplied the client to the Provider that establishes it.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function Root() {
    return (
        <QueryClientProvider client={queryClient}>
            <CalendarApp />
        </QueryClientProvider>
    );
}

const lifecycles = singleSpaReact({
    React,
    ReactDOMClient: { createRoot },
    rootComponent: Root,
    errorBoundary(error) {
        return (
            <MmErrorState
                heading="Calendar unavailable"
                message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
            />
        );
    },
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
