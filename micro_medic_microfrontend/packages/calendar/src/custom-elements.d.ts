/**
 * There is deliberately no blanket `mm-${string}` JSX index signature here any more.
 *
 * That signature made every conceivable `mm-*` tag typecheck, which is how `<mm-field>` — an
 * element the design system never defined — survived review and silently rendered nothing.
 * React components now come from `@micro-medic/design-system-react`, so unknown tags should
 * be a compile error rather than a runtime no-op.
 *
 * If a raw custom element is genuinely needed in JSX, declare that one tag explicitly.
 */
export {};
