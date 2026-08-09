import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { patientService } from "../services/patient.service";
import { type PatientOption } from "../types";
import { debounce } from "../utils";

/** Exported so the UI can describe the threshold without hardcoding the same number. */
export const MIN_SEARCH_CHARACTERS = 2;
const DEBOUNCE_DELAY = 300;

interface PatientSearchResult {
    query: string;
    setQuery: (query: string) => void;
    results: PatientOption[];
    isLoading: boolean;
    error: Error | string | null;
    cancelSearch: () => void;
}

export function usePatientSearch(): PatientSearchResult {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PatientOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | string | null>(null);
    
    const seqRef = useRef(0);

    const runSearch = useMemo(
        () =>
            debounce(async (searchQuery: string) => {
                const seq = ++seqRef.current;
                setIsLoading(true);
                setError(null);
                try {
                    const searchResults = await patientService.search(searchQuery);
                    if (seq === seqRef.current) {
                        setResults(searchResults);
                    }
                } catch (err) {
                    if (seq === seqRef.current) {
                        setError(err as Error);
                        // Drop the previous matches: leaving them on screen next to an error
                        // message invites clicking a result the failed query did not return.
                        setResults([]);
                    }
                } finally {
                    if (seq === seqRef.current) {
                        setIsLoading(false);
                    }
                }
            }, DEBOUNCE_DELAY),
        []
    );

    useEffect(() => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < MIN_SEARCH_CHARACTERS) {
            runSearch.cancel();
            // Bump the sequence so any in-flight requests are ignored
            seqRef.current++;
            setResults([]);
            setIsLoading(false);
            setError(null);
            return;
        }
        runSearch(trimmedQuery);
    }, [query, runSearch]);

    useEffect(() => {
        return () => {
            runSearch.cancel();
        };
    }, [runSearch]);

    const cancelSearch = useCallback(() => {
        runSearch.cancel();
        seqRef.current++;
        setIsLoading(false);
        setError(null);
    }, [runSearch]);

    return {
        query,
        setQuery,
        results,
        isLoading,
        error,
        cancelSearch
    };
}
