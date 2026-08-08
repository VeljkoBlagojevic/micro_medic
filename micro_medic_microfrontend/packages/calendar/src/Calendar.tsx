import React from "react";
import singleSpaReact from "single-spa-react";
import { createRoot } from "react-dom/client";
import { CalendarApp } from "./CalendarApp";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

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
    errorBoundary(err) {
        return <mm-error-state
        heading="Calendar MFE Error"
        message="An error occurred in the Calendar MFE. Please try again later."
        />;
    }
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;