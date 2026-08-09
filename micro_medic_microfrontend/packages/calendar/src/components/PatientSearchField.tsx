import { MmField, MmSpinner } from "@micro-medic/design-system-react";
import { MIN_SEARCH_CHARACTERS, usePatientSearch } from "../hooks/usePatientSearch";
import { PatientOption } from "../types";
import { searchErrorMessage } from "../utils";

interface PatientSearchFieldProps {
    selected: PatientOption | null;
    onSelect: (patient: PatientOption | null) => void;
    error?: string;
}

export function PatientSearchField({ selected, onSelect, error }: PatientSearchFieldProps) {
    const { query, setQuery, results, isLoading, error: searchError } = usePatientSearch();

    if (selected) {
        return (
            <div className="cal-field">
                <span className="cal-field__label">Patient</span>
                <div className="cal-chip">
                    <span>
                        <strong>{selected.label}</strong>
                        <span className="cal-chip__subtext">{selected.sublabel}</span>
                    </span>
                    <button
                        type="button"
                        className="cal-chip__remove"
                        aria-label={`Remove ${selected.label}`}
                        onClick={() => onSelect(null)}
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    const showNoResults =
        !isLoading && !searchError && query.trim().length >= MIN_SEARCH_CHARACTERS && results.length === 0;
    // Keep the previous matches visible while the next request is in flight. Gating the list on
    // `!isLoading` made it vanish on every keystroke, so refining a query meant the options
    // flickered out from under the pointer.
    const showResults = !searchError && results.length > 0;

    return (
        <div className="cal-patient-search">
            <MmField
                name="patientSearch"
                value={query}
                onValueChange={setQuery}
                label="Patient"
                type="search"
                placeholder="Search for a patient..."
                error={error}
                // The search only fires past a threshold, so say so — otherwise a single
                // character looks like a broken search returning nothing.
                hint={`Type at least ${MIN_SEARCH_CHARACTERS} characters to search by name or email.`}
                required
            />
            {isLoading && <MmSpinner size="sm" label="Searching..." />}
            {!isLoading && searchError && (
                <div className="cal-error" role="alert">{searchErrorMessage(searchError)}</div>
            )}
            {showNoResults && <div className="cal-no-results">No patients found.</div>}
            {showResults && (
                // `listbox`/`option` rather than a bare `ul`/`li`, and the options are
                // buttons so they are reachable without a mouse.
                <ul className="cal-results" role="listbox" aria-label="Patient search results">
                    {results.map((patient) => (
                        <li key={patient.id} role="option" aria-selected="false">
                            <button
                                type="button"
                                className="cal-results__option"
                                onClick={() => onSelect(patient)}
                            >
                                <strong>{patient.label}</strong>
                                <span className="cal-results__sublabel">{patient.sublabel}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
