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
declare class AsyncMaybe<T> {
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

type ExtractValue<M> = M extends Maybe<infer T> ? T : M extends AsyncMaybe<infer T> ? T : M extends Promise<infer T> ? ExtractValue<T> : never;
type ReturnMaybeType<Fn extends (...args: any[]) => any> = ExtractValue<ReturnType<Fn>>;

/**
 * Maybe<T> - A container for optional values.
 *
 * Represents either:
 *  - Just<T>: a present value of type T
 *  - Nothing: absence of value (null or undefined)
 *
 * Inspired by functional programming but designed for JS/TS ergonomics.
 */
declare class Maybe<T> {
    readonly _value: T | null | undefined;
    private constructor();
    /**
     * Create a Maybe from a nullable value.
     *
     * @param value - A value that may be null or undefined.
     * @returns A Maybe wrapping the value. Null/undefined become Nothing.
     */
    static fromNullable<T>(value: T | null | undefined): Maybe<T>;
    /**
     * Transform the value if present, otherwise propagate Nothing.
     *
     * @param fn - A function mapping the contained value to a new value.
     * @returns A new Maybe of the mapped value, or Nothing if empty.
     */
    map<U>(fn: (value: T) => U): Maybe<U>;
    /**
     * Transform the value with a function returning Maybe.
     * If Nothing, propagates Nothing.
     *
     * @param fn - A function mapping the contained value to a Maybe.
     * @returns The resulting Maybe from applying the function, or Nothing if empty.
     */
    flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
    /**
     * Replace Nothing with a default value, still wrapped in Maybe.
     * Keeps chaining possible.
     *
     * @param defaultValue - The value to use if this is Nothing.
     * @returns A Maybe containing the original or default value.
     */
    withDefault<U>(defaultValue: U): Maybe<T | U>;
    /**
     * Replace Nothing with a default value and unwrap.
     * Ends the pipeline.
     *
     * @param defaultValue - The value to return if this is Nothing.
     * @returns The contained value if present, otherwise the default.
     */
    getOrElse<U>(defaultValue: U): T | U;
    /**
     * Run a side-effect if Just; return the same Maybe.
     *
     * @param fn - A function executed with the contained value if present.
     * @returns This Maybe instance, unchanged.
     */
    effect(fn: (value: T) => void): Maybe<T>;
    /**
     * Filter the value with a predicate or type guard.
     *
     * Works like Array.filter:
     * - With a predicate, keeps the value only if it passes.
     * - With a type guard, also narrows the type of the Maybe.
     *
     * @param predicate - A predicate or type guard function.
     * @returns A Maybe of the same or narrowed type if the predicate passes, otherwise Nothing.
     *
     * @example
     * Maybe.fromNullable(5).filter(x => x > 3); // Maybe<number>
     *
     * @example
     * const m: Maybe<unknown> = Maybe.fromNullable("hi");
     * const r = m.filter((x): x is string => typeof x === "string");
     * // r inferred as Maybe<string>
     */
    filter<U extends T>(predicate: (value: T) => value is U): Maybe<U>;
    filter(predicate: (value: T) => boolean): Maybe<T>;
    /**
     * Extend an object with a new property if present.
     *
     * @param key - The property name to add.
     * @param fn - A function returning a Maybe of the new property value.
     * @returns A Maybe of the extended object, or Nothing if empty or not an object.
     */
    extend<K extends string, U>(key: K, fn: (value: T) => Maybe<U>): Maybe<T & {
        [P in K]: U;
    }>;
    /**
     * Assign one or more properties to an object inside a Maybe.
     * Runs all property functions and short-circuits to Nothing if:
     * - the Maybe is Nothing
     * - the value is not an object
     * - any property function returns Nothing
     *
     * @param fns - An object where keys are property names and values are functions
     *              returning a Maybe of the property value.
     * @returns A Maybe of the extended object, or Nothing if short-circuited.
     */
    assign<Exts extends Record<string, (value: T) => Maybe<any>>>(fns: Exts): Maybe<T & {
        [K in keyof Exts]: ReturnMaybeType<Exts[K]>;
    }>;
    /**
     * Map and filter over an array inside a Maybe.
     * If Nothing, returns Nothing. If Just with an array,
     * applies the function to each element, keeping only Just results.
     *
     * @typeParam U - The element type of the original array.
     * @typeParam V - The element type of the resulting array.
     * @param fn - A function mapping each element to a Maybe.
     * @returns A Maybe of the filtered/mapped array, or Nothing if empty.
     */
    filterMap<U, V>(this: Maybe<U[]>, fn: (value: U) => Maybe<V>): Maybe<V[]>;
    /**
     * Access the raw inner value.
     *
     * Escape hatch; prefer getOrElse() in most cases.
     *
     * @returns The contained value if present, otherwise null or undefined.
     */
    value(): T | null | undefined;
}

/**
 * Lightweight functional wrappers for Maybe and AsyncMaybe.
 *
 * This file intentionally uses `any` in the implementation bodies to keep
 * overloads simple and to avoid TypeScript inference edge cases in the
 * wrapper layer. The public typings on the overloads remain accurate.
 *
 * The implementation simply forwards to the appropriate method on the
 * provided container (Maybe or AsyncMaybe) using casts to `any`.
 */
declare const fromNullable: typeof Maybe.fromNullable;
declare const fromPromise: typeof AsyncMaybe.fromPromise;
declare const fromMaybe: typeof AsyncMaybe.fromMaybe;
declare function map<A, B>(fn: (value: A) => B): {
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
    (m: Maybe<A>): Maybe<B>;
};
declare function flatMap<A, B>(fn: (a: A) => Maybe<B>): {
    (m: Maybe<A>): Maybe<B>;
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
declare function flatMap<A, B>(fn: (a: A) => AsyncMaybe<B>): {
    (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<B>;
};
declare function filter<A, B extends A>(predicate: (value: A) => value is B): {
    (m: Maybe<A>): Maybe<B>;
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
declare function filter<A>(predicate: (value: A) => boolean): {
    (m: Maybe<A>): Maybe<A>;
    (m: AsyncMaybe<A>): AsyncMaybe<A>;
};
declare function filterMap<A, B>(fn: (value: A) => Maybe<B>): {
    <M extends Maybe<A[]> | AsyncMaybe<A[]>>(m: M): M extends AsyncMaybe<A[]> ? AsyncMaybe<B[]> : Maybe<B[]>;
};
declare function filterMap<A, B>(fn: (value: A) => AsyncMaybe<B>): {
    (m: Maybe<A[]>): AsyncMaybe<B[]>;
    (m: AsyncMaybe<A[]>): AsyncMaybe<B[]>;
};
declare function extend<A extends object, K extends string, B>(key: K, fn: (value: A) => Maybe<B>): {
    (m: Maybe<A>): Maybe<A & {
        [P in K]: B;
    }>;
    (m: AsyncMaybe<A>): AsyncMaybe<A & {
        [P in K]: B;
    }>;
};
declare function extend<A extends object, K extends string, B>(key: K, fn: (value: A) => AsyncMaybe<B>): {
    (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<A & {
        [P in K]: B;
    }>;
};
declare function assign<A extends object, Exts extends Record<string, (value: A) => Maybe<any>>>(fns: Exts): (m: Maybe<A>) => Maybe<A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
}>;
declare function assign<A extends object, Exts extends Record<string, (value: A) => Maybe<any> | AsyncMaybe<any> | Promise<Maybe<any> | AsyncMaybe<any>>>>(fns: Exts): (m: Maybe<A> | AsyncMaybe<A>) => AsyncMaybe<A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
}>;
declare function withDefault<B>(defaultValue: B): {
    <M extends Maybe<any> | AsyncMaybe<any>>(m: M): M extends Maybe<infer A> ? Maybe<A | B> : M extends AsyncMaybe<infer A> ? AsyncMaybe<A | B> : never;
};
declare function getOrElse<A, B>(defaultValue: B): {
    (m: Maybe<A>): A | B;
    (m: AsyncMaybe<A>): Promise<A | B>;
};
declare function effect<A>(fn: (value: A) => void | Promise<void>): {
    (m: Maybe<A>): Maybe<A>;
    (m: AsyncMaybe<A>): AsyncMaybe<A>;
};

export { AsyncMaybe, Maybe, assign, effect, extend, filter, filterMap, flatMap, fromMaybe, fromNullable, fromPromise, getOrElse, map, withDefault };
