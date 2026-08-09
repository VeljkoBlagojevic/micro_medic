import { useEffect, useState } from 'react';
import type { SpecializationDepartmentDto } from '@micro-medic/shared-types';
import { specializationService } from '../services/specialization.service.js';

/** Large enough to hold the seeded department list in one page, so there is no pager to build. */
const PAGE_SIZE = 100;

interface SpecializationsState {
    specializations: SpecializationDepartmentDto[];
    loading: boolean;
    /** True when the list could not be loaded — the form falls back to a plain number field. */
    failed: boolean;
}

/**
 * Loads the specialization departments for the doctor registration form.
 *
 * Fetched rather than hardcoded: the table is populated by `POST /api/seeder/specialization`,
 * so the ids differ between environments and a baked-in list would silently point at the
 * wrong department.
 */
export function useSpecializations(enabled: boolean): SpecializationsState {
    const [state, setState] = useState<SpecializationsState>({
        specializations: [],
        loading: false,
        failed: false,
    });

    useEffect(() => {
        if (!enabled) return;

        // Guards against a state update after unmount, and against an out-of-order response
        // if `enabled` toggles quickly.
        let active = true;
        setState({ specializations: [], loading: true, failed: false });

        specializationService
            .list({ size: PAGE_SIZE })
            .then((page) => {
                if (!active) return;
                setState({ specializations: page.content, loading: false, failed: false });
            })
            .catch((error: unknown) => {
                if (!active) return;
                // Not fatal: registration still works if the doctor types the id, so this
                // degrades rather than blocking the form.
                console.error('[auth] Could not load specializations:', error);
                setState({ specializations: [], loading: false, failed: true });
            });

        return () => {
            active = false;
        };
    }, [enabled]);

    return state;
}
