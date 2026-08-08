import { ApiError } from '@micro-medic/api-client';

export function bookingErrorMessage(error: any): string {
    if (error instanceof ApiError) {
        if (error.status === 409 || error.isValidationError) {
            return error.message || "That time slot conflicts with another booking. Please choose a different time.";
        }
        if (error.isForbidden) {
            return "You can only modify your own appointments.";
        }
        if (error.isUnauthorized) {
            return "You session has expired. Please log in again.";
        }
        if (error.isNotFound) {
            return "The appointment you are trying to modify does not exist.";
        }
        if (error.isServerError) {
            return "There was a problem with the server. Please try again later.";
        }
        if (error.status === 0) {
            return "Unable to connect to the server. Please check your internet connection and try again.";
        }
        return "An unexpected error occurred. Please try again.";
    }

    return "An unexpected error occurred. Please try again.";
}

export function loadErrorMessage(error: any): string {
    if (error instanceof ApiError) {
        if (error.isUnauthorized) {
            return "You session has expired. Please log in again.";
        }
        if (error.isServerError) {
            return "There was a problem with the calendar service. Please try again later.";
        }
        if (error.status === 0) {
            return "Unable to connect to the calendar service. Please check your internet connection and try again.";
        }
    }
    return "Could not load the calendar. Please try again later.";
}

export function searchErrorMessage(error: any): string {
    if (error instanceof ApiError && error.status === 0) {
        return "Unable to connect to the calendar service. Please check your internet connection and try again.";
    }
    return "Could not search the calendar. Please try again later.";
}