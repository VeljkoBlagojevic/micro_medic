import { MmField, MmSpinner } from "@micro-medic/design-system-react";
import { usePatientSearch } from "../hooks/usePatientSearch";
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
                <span className="cal-field-label">Patient</span>
                <div className="cal-chip">
                    <span>
                        <strong>{selected.label}</strong>
                        <span className="cal-chip-subtext">{selected.sublabel}</span>
                    </span>
                    <button
                        type="button"
                        className="cal-chip-remove"
                        aria-label={`Remove ${selected.label}`}
                        onClick={() => onSelect(null)}
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    const showNoResults = !isLoading && !searchError && query.trim().length >= 2 && results.length === 0;

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
                required
            />
            {isLoading && <MmSpinner size="sm" label="Searching..." />}
            {!isLoading && searchError && (
                <div className="cal-error" role="alert">{searchErrorMessage(searchError)}</div>
            )}
            {showNoResults && <div className="cal-no-results">No patients found.</div>}
            {!isLoading && !searchError && results.length > 0 && (
                // `listbox`/`option` rather than a bare `ul`/`li`, and the options are
                // buttons so they are reachable without a mouse.
                <ul className="cal-search-results" role="listbox" aria-label="Patient search results">
                    {results.map((patient) => (
                        <li key={patient.id} role="option" aria-selected="false">
                            <button type="button" onClick={() => onSelect(patient)}>
                                <strong>{patient.label}</strong>
                                <span className="cal-search-result-sublabel">{patient.sublabel}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
