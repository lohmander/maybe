import { Maybe } from "./Maybe";
import type { ReturnMaybeType } from "./types";
/**
 * AsyncMaybe<T> - An async container for optional values.
 *
 * Represents a Promise that resolves to either:
 *  - Just<T>: a present value of type T
 *  - Nothing: absence of value (null or undefined)
 *
 * Mirrors Maybe’s API but for async flows, reusing Maybe internally
 * wherever possible.
 */
export declare class AsyncMaybe<T> {
    readonly _value: Promise<T | null | undefined>;
    private constructor();
    /**
     * fromNullable - Creates an AsyncMaybe from a possibly-null/undefined value.
     *
     * @typeParam T - The type of the contained value.
     * @param value - A value that may be null or undefined.
     * @returns An AsyncMaybe wrapping the given value.
     */
    static fromNullable<T>(value: T | null | undefined): AsyncMaybe<T>;
    /**
     * fromPromise - Creates an AsyncMaybe from a Promise.
     *
     * @typeParam T - The type of the resolved value.
     * @param promise - A promise resolving to a value that may be null/undefined.
     * @returns An AsyncMaybe wrapping the promise.
     */
    static fromPromise<T>(promise: Promise<T | null | undefined>): AsyncMaybe<T>;
    /**
     * fromMaybe - Lifts a synchronous Maybe into an AsyncMaybe.
     *
     * @typeParam T - The type contained by the Maybe.
     * @param maybe - A Maybe instance.
     * @returns An AsyncMaybe wrapping the Maybe’s value.
     */
    static fromMaybe<T>(maybe: Maybe<T>): AsyncMaybe<T>;
    /**
     * map - Transforms the inner value if present.
     *
     * @typeParam U - The result type of the mapping function.
     * @param fn - A function mapping the contained value.
     * @returns A new AsyncMaybe with the mapped value, or Nothing if absent.
     */
    map<U>(fn: (value: T) => U): AsyncMaybe<U>;
    /**
     * flatMap - Chains async or sync Maybe-like computations.
     *
     * Accepts functions returning:
     *  - Maybe<U>
     *  - AsyncMaybe<U>
     *  - U
     *  - Promise<Maybe<U> | AsyncMaybe<U> | U>
     *
     * @typeParam U - The type returned by the function.
     * @param fn - A function that transforms the contained value.
     * @returns A new AsyncMaybe containing the flattened result, or Nothing if absent.
     */
    flatMap<U>(fn: (value: T) => Maybe<U> | AsyncMaybe<U> | U | Promise<Maybe<U> | AsyncMaybe<U> | U>): AsyncMaybe<U>;
    /**
     * filter - Narrows or discards the value based on a predicate or type guard.
     *
     * Semantics:
     *  - If the source is Nothing (null/undefined), it is preserved as-is.
     *  - If the source is present but the predicate fails, the result is **undefined**.
     *  - With a type guard, the resulting AsyncMaybe’s type is narrowed.
     *
     * @typeParam U - The narrowed type (when using a type guard).
     * @param predicate - A boolean predicate or type guard.
     * @returns A new AsyncMaybe with the original value if it passes, or Nothing.
     */
    filter<U extends T>(predicate: (value: T) => value is U): AsyncMaybe<U>;
    filter(predicate: (value: T) => boolean): AsyncMaybe<T>;
    /**
     * extend - Extends an object with a new property if present.
     *
     * Uses `filter`’s semantics, so:
     *  - null/undefined are preserved,
     *  - non-object present values become undefined.
     *
     * @typeParam K - The property key to add.
     * @typeParam U - The property value type.
     * @param key - The property name.
     * @param fn - A function returning a Maybe/AsyncMaybe/value for the property.
     * @returns A new AsyncMaybe containing the extended object, or Nothing.
     */
    extend<K extends string, U>(key: K, fn: (value: T) => Maybe<U> | AsyncMaybe<U> | U | Promise<Maybe<U> | AsyncMaybe<U> | U>): AsyncMaybe<T & {
        [P in K]: U;
    }>;
    /**
     * Assign one or more properties to an object inside an AsyncMaybe.
     * Runs all property functions in parallel and short-circuits to Nothing if:
     * - the AsyncMaybe is Nothing
     * - the value is not an object
     * - any property function returns Nothing
     *
     * @param fns - An object where keys are property names and values are functions
     *              returning a Maybe or AsyncMaybe of the property value.
     * @returns An AsyncMaybe of the extended object, or Nothing if short-circuited.
     */
    assign<Exts extends Record<string, (value: any) => Maybe<any> | AsyncMaybe<any> | Promise<Maybe<any> | AsyncMaybe<any>>>>(fns: Exts): AsyncMaybe<T & {
        [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
    }>;
    /**
     * filterMap - Maps and filters an array inside an AsyncMaybe.
     *
     * Semantics:
     *  - If the source is null/undefined, it is preserved as-is.
     *  - If the source is present but **not an array**, the result is **undefined**.
     *  - Array elements mapped to null/undefined are dropped.
     *
     * @typeParam U - The element type of the source array.
     * @typeParam V - The element type of the result array.
     * @param fn - A function returning a Maybe/AsyncMaybe/value for each element.
     * @returns A new AsyncMaybe containing the filtered/mapped array, or Nothing.
     */
    filterMap<U, V>(this: AsyncMaybe<U[]>, fn: (value: U) => Maybe<V> | AsyncMaybe<V> | V | Promise<Maybe<V> | AsyncMaybe<V> | V>): AsyncMaybe<V[]>;
    /**
     * withDefault - Provides a default value if Nothing.
     *
     * @typeParam U - The type of the default value.
     * @param defaultValue - A fallback value.
     * @returns A new AsyncMaybe containing the original or default value.
     */
    withDefault<U>(defaultValue: U): AsyncMaybe<T | U>;
    /**
     * getOrElse - Provides a default value if Nothing and unwraps the result.
     *
     * @typeParam U - The type of the default value.
     * @param defaultValue - A fallback value.
     * @returns A Promise resolving to the original or default value.
     */
    getOrElse<U>(defaultValue: U): Promise<T | U>;
    /**
     * effect - Executes a side-effect if Just.
     *
     * @param fn - A function to run with the contained value if present.
     * @returns A new AsyncMaybe containing the original value.
     */
    effect(fn: (value: T) => void | Promise<void>): AsyncMaybe<T>;
    /**
     * value - Accesses the raw underlying promise.
     *
     * Escape hatch; prefer getOrElse() in most cases.
     *
     * @returns A Promise resolving to the contained value or Nothing.
     */
    value(): Promise<T | null | undefined>;
}
//# sourceMappingURL=AsyncMaybe.d.ts.map