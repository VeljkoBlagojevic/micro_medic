/**
 * Input coercion helpers.
 *
 * Angular exports `booleanAttribute` and `numberAttribute` itself, but they are re-implemented
 * here so this package's `@angular/core` peer range can stay wide (`>=18`) without depending
 * on when each helper became available.
 */

/**
 * Mirrors Angular's `booleanAttribute`: a present-but-valueless attribute is `true`, the
 * literal string `'false'` is `false`, and anything else follows JS truthiness.
 *
 * This is what makes `<mm-button disabled>` behave like a native `<button disabled>`. Without
 * coercion the bare attribute form binds the empty string, which is falsy — the exact opposite
 * of what the template author wrote.
 */
export function booleanInput(value: unknown): boolean {
    return value != null && `${value}` !== 'false';
}

/** Mirrors Angular's `numberAttribute`, so `rows="4"` from a template is forwarded as `4`. */
export function numberInput(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isNaN(parsed) ? 0 : parsed;
}
