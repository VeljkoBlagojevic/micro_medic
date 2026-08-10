/**
 * Splits `text` into alternating non-matching and matching segments for `term`.
 *
 * Returns *data*, not markup, and that is the whole design of this module. The obvious
 * implementation — `text.replace(re, '<mark>$&</mark>')` fed to `v-html` — would put a string
 * assembled from a backend value into the DOM as HTML, and the ICD-10 descriptions are seeded from
 * an 8.6 MB JSON file nobody in this repo has read end to end. Returning segments lets the template
 * render them with `{{ }}`, so Vue escapes every one and there is no injection surface to reason
 * about. The previous plain-JS implementation had to carry its own `escapeHtml` and an `ESCAPES` map
 * precisely because it built markup by hand.
 *
 * Matching is case-insensitive and literal: `indexOf` on lowercased copies rather than a `RegExp`,
 * because an ICD-10 term contains `.` (`A00.1`) and users type `(` and `+`. A regex built from user
 * input would either need escaping or would silently match the wrong thing — and `escapeRegExp` is a
 * dependency this needs no part of. Indices from the lowercased copy are valid in the original:
 * `toLowerCase` is length-preserving for every character in this data set.
 */
export interface HighlightSegment {
    text: string;
    match: boolean;
}

export function highlightSegments(text: string, term: string): HighlightSegment[] {
    const needle = term.trim().toLowerCase();
    if (!needle) return [{ text, match: false }];

    const haystack = text.toLowerCase();
    const segments: HighlightSegment[] = [];
    let cursor = 0;

    for (;;) {
        const found = haystack.indexOf(needle, cursor);
        if (found === -1) break;

        if (found > cursor) {
            segments.push({ text: text.slice(cursor, found), match: false });
        }
        segments.push({ text: text.slice(found, found + needle.length), match: true });
        cursor = found + needle.length;
    }

    if (cursor < text.length) {
        segments.push({ text: text.slice(cursor), match: false });
    }

    // A term that matched nothing in *this* field is normal: the backend searches code OR
    // description, so a row can match on its code and have no highlight in its description.
    return segments.length > 0 ? segments : [{ text, match: false }];
}
