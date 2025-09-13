import { Maybe } from "./Maybe";
import { AsyncMaybe } from "./AsyncMaybe";

/**
 * fromNullable - Creates a Maybe or AsyncMaybe from a possibly-null/undefined value.
 *
 * @typeParam T - The type of the contained value.
 * @param value - A value that may be null or undefined.
 * @returns A Maybe<T> containing the value if not null/undefined, otherwise Nothing.
 */
export const fromNullable = Maybe.fromNullable;

/**
 * fromPromise - Creates an AsyncMaybe from a Promise of a possibly-null/undefined value.
 *
 * @typeParam T - The type of the resolved value.
 * @param promise - A Promise resolving to a value that may be null or undefined.
 * @returns An AsyncMaybe<T> containing the resolved value or Nothing.
 */
export const fromPromise = AsyncMaybe.fromPromise;

/**
 * fromMaybe - Lifts a synchronous Maybe into an AsyncMaybe.
 *
 * @typeParam T - The type contained by the Maybe.
 * @param maybe - A Maybe instance.
 * @returns An AsyncMaybe<T> wrapping the Maybe’s value.
 */
export const fromMaybe = AsyncMaybe.fromMaybe;

/**
 * map - Functor map for Maybe and AsyncMaybe.
 *
 * Applies a mapping function to the contained value if present.
 *
 * @typeParam A - The input value type.
 * @typeParam B - The result type of the mapping function.
 * @param fn - A mapping function.
 * @returns A function that maps a Maybe<A> to Maybe<B> or an AsyncMaybe<A> to AsyncMaybe<B>.
 */
export function map<A, B>(
  fn: (value: A) => B,
): {
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
  (m: Maybe<A>): Maybe<B>;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) => m.map(fn as any)) as any;
}

/**
 * flatMap - Monad flatMap for Maybe and AsyncMaybe.
 *
 * Applies a function returning a Maybe, AsyncMaybe, Promise, or raw value,
 * and flattens the result.
 *
 * @typeParam A - The input value type.
 * @typeParam B - The result type of the flatMap function.
 * @param fn - A function mapping the value to a Maybe<B>, AsyncMaybe<B>, B, or Promise thereof.
 * @returns A function that flatMaps a Maybe<A> to Maybe<B> or an AsyncMaybe<A> to AsyncMaybe<B>.
 */
export function flatMap<A, B>(
  fn: (a: A) => Maybe<B>,
): {
  (m: Maybe<A>): Maybe<B>;
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export function flatMap<A, B>(
  fn: (a: A) => AsyncMaybe<B>,
): (m: Maybe<A> | AsyncMaybe<A>) => AsyncMaybe<B>;
export function flatMap<A, B>(
  fn: (a: A) => Maybe<B> | AsyncMaybe<B>,
): (m: any) => Maybe<B> | AsyncMaybe<B> {
  return (m: Maybe<A> | AsyncMaybe<A>) =>
    (m as Maybe<A> | AsyncMaybe<A>).flatMap(fn as any) as any;
}

/**
 * filter - Filters or refines the contained value.
 *
 * Semantics:
 * - If the source is Nothing (null/undefined), it is preserved as-is.
 * - If the source is present but the predicate fails, the result is Nothing.
 * - If the predicate is a type guard, the type is narrowed.
 *
 * @typeParam A - The input value type.
 * @typeParam B - The narrowed type when using a type guard.
 * @param predicate - A predicate or type guard.
 * @returns A function that filters a Maybe<A> or AsyncMaybe<A>, producing the narrowed type if applicable.
 */
export function filter<A, B extends A>(
  predicate: (value: A) => value is B,
): {
  (m: Maybe<A>): Maybe<B>;
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export function filter<A>(predicate: (value: A) => boolean): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
};
export function filter<A>(predicate: (value: A) => boolean): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) => m.filter(predicate as any)) as any;
}

/**
 * filterMap - Maps and filters an array inside a Maybe or AsyncMaybe.
 *
 * Semantics:
 * - If the source is Nothing, it is preserved as-is.
 * - If the source is present but not an array, the result is Nothing.
 * - Array elements mapped to null/undefined are dropped.
 *
 * @typeParam A - The element type of the source array.
 * @typeParam B - The element type of the result array.
 * @param fn - A mapping function returning a Maybe<B>, AsyncMaybe<B>, B, or Promise thereof.
 * @returns A function that filterMaps a Maybe<A[]> to Maybe<B[]> or an AsyncMaybe<A[]> to AsyncMaybe<B[]>.
 */
export function filterMap<A, B>(
  fn: (value: A) => Maybe<B>,
): {
  <M extends Maybe<A[]> | AsyncMaybe<A[]>>(
    m: M,
  ): M extends AsyncMaybe<A[]> ? AsyncMaybe<B[]> : Maybe<B[]>;
};
export function filterMap<A, B>(
  fn: (value: A) => AsyncMaybe<B>,
): {
  (m: Maybe<A[]>): AsyncMaybe<B[]>;
  (m: AsyncMaybe<A[]>): AsyncMaybe<B[]>;
};
export function filterMap<A, B>(
  fn: (value: A) => Maybe<B> | AsyncMaybe<B>,
): (m: any) => Maybe<B[]> | AsyncMaybe<B[]> {
  return (m) => (m as any).filterMap(fn as any) as any;
}

/**
 * extend - Extends an object inside a Maybe or AsyncMaybe with a new property.
 *
 * @typeParam A - The object type of the contained value.
 * @typeParam K - The property key to add.
 * @typeParam B - The type of the property value.
 * @param key - The property name.
 * @param fn - A function returning a Maybe<B>, AsyncMaybe<B>, B, or Promise thereof.
 * @returns A function that extends a Maybe<A> to Maybe<A & { [P in K]: B }> or an AsyncMaybe<A> to AsyncMaybe<A & { [P in K]: B }>.
 */
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => Maybe<B>,
): {
  (m: Maybe<A>): Maybe<A & { [P in K]: B }>;
  (m: AsyncMaybe<A>): AsyncMaybe<A & { [P in K]: B }>;
};
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => AsyncMaybe<B>,
): {
  (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<A & { [P in K]: B }>;
};
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => Maybe<B> | AsyncMaybe<B>,
): {
  (m: Maybe<A> | AsyncMaybe<A>): any;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) => m.extend(key, fn as any)) as any;
}

/**
 * withDefault - Provides a default value if the Maybe or AsyncMaybe is Nothing.
 *
 * @typeParam A - The input value type.
 * @typeParam B - The type of the default value.
 * @param defaultValue - A fallback value.
 * @returns A function that ensures a Maybe<A> becomes Maybe<A | B> or an AsyncMaybe<A> becomes AsyncMaybe<A | B>.
 */
export function withDefault<A, B>(
  defaultValue: B,
): {
  (m: Maybe<A>): Maybe<A | B>;
  (m: AsyncMaybe<A>): AsyncMaybe<A | B>;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) => m.withDefault(defaultValue)) as any;
}

/**
 * getOrElse - Provides a default value if Nothing and unwraps the result.
 *
 * @typeParam A - The input value type.
 * @typeParam B - The type of the default value.
 * @param defaultValue - A fallback value.
 * @returns A function that unwraps a Maybe<A> to A | B or an AsyncMaybe<A> to Promise<A | B>.
 */
export function getOrElse<A, B>(
  defaultValue: B,
): {
  (m: Maybe<A>): A | B;
  (m: AsyncMaybe<A>): Promise<A | B>;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) =>
    (m as any).getOrElse(defaultValue)) as any;
}

/**
 * effect - Runs a side-effect if the value is present.
 *
 * The original container is returned for further chaining.
 *
 * @typeParam A - The input value type.
 * @param fn - A function to execute with the contained value if present.
 * @returns A function that returns the original Maybe<A> or AsyncMaybe<A>.
 */
export function effect<A>(fn: (value: A) => void | Promise<void>): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
} {
  return ((m: Maybe<A> | AsyncMaybe<A>) => m.effect(fn as any)) as any;
}
