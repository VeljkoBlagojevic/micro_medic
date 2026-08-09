import {
    Directive,
    ElementRef,
    type EventEmitter,
    inject,
    type OnChanges,
    type SimpleChanges,
} from '@angular/core';

/**
 * Base class for every `mm-*` binding directive.
 *
 * ## Why the directives exist at all
 *
 * Angular *can* talk to a custom element without any wrapper — but only after the consuming
 * component opts into `CUSTOM_ELEMENTS_SCHEMA`, which switches off template type checking for
 * every unknown tag in that component. That trade is a bad one: `<mm-button varaint="primary">`
 * and `<mm-modal [oepn]="true">` both compile silently, and a typo in a design-system prop
 * becomes a runtime bug instead of a build error.
 *
 * Declaring a directive whose selector *is* the tag fixes this. Angular resolves `[variant]`
 * against the directive's `@Input`, so:
 *   - no `CUSTOM_ELEMENTS_SCHEMA` is needed anywhere,
 *   - `strictTemplates` type-checks every binding, and
 *   - a misspelled or wrongly-typed input fails the build.
 *
 * ## Why properties, not attributes
 *
 * A directive `@Input` does not automatically reach the DOM element — it sets a field on the
 * *directive*. So each input is forwarded to the element as a **property** here. That matters
 * for the same reason it does in React: an attribute can only carry a string, so
 * `[rows]="columns"` on `mm-table` would stringify an array to `"[object Object]"`, and
 * `[open]="false"` would become the string `"false"` — truthy as an attribute, so the modal
 * would never close.
 *
 * Subclasses only declare inputs; forwarding is generic. An input whose name matches the
 * element's property name needs no extra code.
 */
@Directive()
export abstract class MmElementDirective<TElement extends HTMLElement> implements OnChanges {
    // The type argument is on `inject`, not just the field: `inject(ElementRef)` resolves to
    // `ElementRef<any>`, and annotating only the field launders that `any` through an assignment
    // instead of narrowing it. Naming the type at the injection site is what actually types
    // `nativeElement` as `TElement`.
    protected readonly elementRef = inject<ElementRef<TElement>>(ElementRef);

    /** The underlying custom element, for callers that need its imperative API. */
    get nativeElement(): TElement {
        return this.elementRef.nativeElement;
    }

    /**
     * Inputs that must not be forwarded — either because the directive handles them itself or
     * because the name collides with something on `HTMLElement`. Subclasses may extend this.
     */
    protected readonly nonForwardedInputs: ReadonlySet<string> = new Set<string>();

    ngOnChanges(changes: SimpleChanges): void {
        // Indexed as a plain record: TypeScript will not accept a write through an index
        // signature on a generic type, and the property names are validated by each
        // subclass's `@Input` names matching the element's own properties.
        const element = this.elementRef.nativeElement as unknown as Record<string, unknown>;

        for (const [name, change] of Object.entries(changes)) {
            if (this.nonForwardedInputs.has(name)) continue;
            // `undefined` means "not provided"; writing it would clobber the element's own
            // default (e.g. mm-spinner's `label`) with undefined.
            if (change.currentValue === undefined) continue;
            element[name] = change.currentValue;
        }
    }

    /**
     * Re-emits a custom element event through an `@Output`.
     *
     * Angular types `$event` in a host listener as `Event`: it resolves the event name against
     * the known DOM event map, and `mm-close` is not in it, so it cannot know a `CustomEvent`
     * with a `detail` arrives. Under `strictTemplates` that makes
     * `'(mm-close)': 'close.emit($event)'` a compile error. Narrowing here keeps the cast in one
     * place instead of once per directive, and keeps the *public* output type accurate — a
     * consumer's `$event.detail` is still type-checked.
     */
    protected forward<T>(emitter: EventEmitter<CustomEvent<T>>, event: Event): void {
        emitter.emit(event as CustomEvent<T>);
    }
}
