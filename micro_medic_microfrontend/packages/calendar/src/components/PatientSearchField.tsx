import { useEffect, useRef } from "react";
import { usePatientSearch } from "../hooks/usePatientSearch";
import { PatientOption } from "../types";

interface PatientSearchFieldProps {
    selected: PatientOption | null;
    onSelect: (patient: PatientOption | null) => void;
    error?: string;
}

export function PatientSearchField({ selected, onSelect, error }: PatientSearchFieldProps) {
    const { query, setQuery, results, isLoading, error: searchError } = usePatientSearch();
    const inputRef = useRef<HTMLInputElement & { value: string; error: string }>(null);

    // Reflect the controller queryt + validation error onto the Lit input.
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = query;
        }
    }, [query]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.error = error ?? '';
        }
    }, [error]);   

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const onInput = (event: Event) => {
            const target = event.target as HTMLInputElement;
            setQuery(target.value);
        }
        el.addEventListener('mm-input', onInput);
        el.addEventListener('mm-change', onInput);
        return () => {
            el.removeEventListener('mm-input', onInput);
            el.removeEventListener('mm-change', onInput);
        };
    }, [setQuery]);

    if (selected) {
        return (
            <div className="cal-field">
                <span className="cal-field-label">Patient</span>
                <div className="cal-chip">
                    <span>
                        <strong>{selected.label}</strong>
                        <span className="cal-chip-subtext">{selected.sublabel}</span>
                    </span>
                    <button
                        type="button"
                        className="cal-chip-remove"
                        aria-label="Remove selected patient"
                        onClick={() => onSelect(null)}
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cal-search-field">
            <mm-field
                ref={inputRef}
                label="Patient"
                type="search"
                placeholder="Search for a patient..."
            />
            {isLoading && <mm-spinner size="small" label="Searching..." />}
            {!isLoading && searchError && (
                <div className="cal-error">
                    {typeof searchError === "string" ? searchError : searchError.message}
                </div>
            )}
            {!isLoading && !searchError && query.trim().length >= 2 && results.length === 0 && (
                <div className="cal-no-results">No patients found.</div>
            )}
            {!isLoading && !searchError && results.length > 0 && (
                <ul className="cal-search-results">
                    {results.map((patient) => (
                        <li key={patient.id} onClick={() => onSelect(patient)}>
                            <strong>{patient.label}</strong>
                            <span className="cal-search-result-sublabel">{patient.sublabel}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
    