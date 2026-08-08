import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { patientService } from "../services/patient.service";
import { PatientOption } from "../types";
import { debounce } from "../utils";

const MIN_CHARACTERS = 2;
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
    const [error, setError] = useState<Error | string | null>('');
    
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
        if (trimmedQuery.length < MIN_CHARACTERS) {
            runSearch.cancel();
            // Bpm the sequence so any in-flight requests are ignored
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
