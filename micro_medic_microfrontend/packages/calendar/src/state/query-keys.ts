export const queryKeys = {
    calendar: ['calendar'] as const,
    patientSearch: (query: string) => ['patient-search', query] as const
}