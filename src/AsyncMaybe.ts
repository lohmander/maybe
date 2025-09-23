import { Maybe } from "./Maybe";
import type { ExtractMaybeArrayValue, ReturnMaybeType } from "./types";
import { isJust, isNothing } from "./utils";

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
export class AsyncMaybe<T> {
  private constructor(public readonly _value: Promise<T | null | undefined>) {}

  /**
   * fromNullable - Creates an AsyncMaybe from a possibly-null/undefined value.
   *
   * @typeParam T - The type of the contained value.
   * @param value - A value that may be null or undefined.
   * @returns An AsyncMaybe wrapping the given value.
   */
  static fromNullable<T>(value: T | null | undefined): AsyncMaybe<T> {
    return new AsyncMaybe(Promise.resolve(value));
  }

  /**
   * fromPromise - Creates an AsyncMaybe from a Promise.
   *
   * @typeParam T - The type of the resolved value.
   * @param promise - A promise resolving to a value that may be null/undefined.
   * @returns An AsyncMaybe wrapping the promise.
   */
  static fromPromise<T>(promise: Promise<T | null | undefined>): AsyncMaybe<T> {
    return new AsyncMaybe(promise);
  }

  /**
   * fromMaybe - Lifts a synchronous Maybe into an AsyncMaybe.
   *
   * @typeParam T - The type contained by the Maybe.
   * @param maybe - A Maybe instance.
   * @returns An AsyncMaybe wrapping the Maybe’s value.
   */
  static fromMaybe<T>(maybe: Maybe<T>): AsyncMaybe<T> {
    return new AsyncMaybe(Promise.resolve(maybe.value()));
  }

  /**
   * map - Transforms the inner value if present.
   *
   * @typeParam U - The result type of the mapping function.
   * @param fn - A function mapping the contained value.
   * @returns A new AsyncMaybe with the mapped value, or Nothing if absent.
   */
  map<U>(fn: (value: T) => U): AsyncMaybe<U> {
    const next = (async () => {
      const v = await this._value;
      return Maybe.fromNullable(v).map(fn).value();
    })();
    return new AsyncMaybe(next);
  }

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
  flatMap<U>(
    fn: (value: T) => Maybe<U> | AsyncMaybe<U> | U | Promise<Maybe<U> | AsyncMaybe<U> | U>,
  ): AsyncMaybe<U> {
    const next = (async () => {
      const v = await this._value;
      if (isNothing(v)) return v as unknown as U;

      const out = await fn(v as T);
      if (out instanceof AsyncMaybe) return await out.value();
      if (out instanceof Maybe) return out.value();
      return out as U;
    })();
    return new AsyncMaybe(next);
  }

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
  // Relax predicate type so user-supplied type predicates work when T is arbitrary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter(predicate: ((value: T) => boolean) | ((value: T) => value is any)): AsyncMaybe<any> {
    const next = (async () => {
      const v = await this._value;
      if (v == null) {
        // preserve null/undefined
        return v;
      }
      // Only keep if predicate passes
      if ((predicate as (v: T) => boolean)(v as T)) return v;

      // present but failed → null
      return null;
    })();
    return new AsyncMaybe(next);
  }

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
  extend<K extends string, U>(
    key: K,
    fn: (value: T) => Maybe<U> | AsyncMaybe<U> | U | Promise<Maybe<U> | AsyncMaybe<U> | U>,
  ): AsyncMaybe<T & { [P in K]: U }> {
    return this.filter((v): v is T & object => typeof v === "object" && v !== null).flatMap((obj) =>
      AsyncMaybe.fromPromise(
        (async () => {
          const out = await fn(obj);
          const lifted =
            out instanceof AsyncMaybe
              ? out
              : out instanceof Maybe
                ? AsyncMaybe.fromMaybe(out)
                : AsyncMaybe.fromNullable(out as U);

          const newVal = await lifted.value();
          return newVal == null
            ? null
            : ({ ...(obj as T & Record<string, unknown>), [key]: newVal } as T & { [P in K]: U });
        })(),
      ),
    );
  }

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
  assign<
    Exts extends Record<
      string,
      // allow functions with a loose parameter type to avoid incompatibility when T is generic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value: any) => Maybe<any> | AsyncMaybe<any> | Promise<Maybe<any> | AsyncMaybe<any>>
    >,
  >(
    fns: Exts,
  ): AsyncMaybe<
    T & {
      [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
    }
  > {
    return this.flatMap((obj) => {
      if (typeof obj !== "object" || obj === null) return AsyncMaybe.fromNullable(null);

      // Run all extenders in parallel
      const tasks = Object.entries(fns).map(async ([key, fn]) => {
        const res = await Promise.resolve(fn(obj)).then((res) => res.value());
        return [key, res] as const;
      });

      return AsyncMaybe.fromPromise(
        Promise.all(tasks).then((resolved) => {
          // Short-circuit: if any extender is Nothing, bail out
          if (resolved.some(([, v]) => isNothing(v))) return null;

          return { ...obj, ...Object.fromEntries(resolved) };
        }),
      );
    }) as AsyncMaybe<T & { [P in keyof Exts]: ReturnMaybeType<Exts[P]> }>;
  }

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
  filterMap<U, V>(
    this: AsyncMaybe<U[]>,
    fn: (value: U) => Maybe<V> | AsyncMaybe<V> | V | Promise<Maybe<V> | AsyncMaybe<V> | V>,
  ): AsyncMaybe<V[]> {
    const next = (async () => {
      const raw = await this._value;

      // Preserve original Nothing exactly
      if (raw == null) return raw as unknown as V[] | null | undefined;

      // Present but not an array → undefined
      if (!Array.isArray(raw)) return null;

      const values = await Promise.all(
        (raw as U[]).map(async (el) => {
          const out = await fn(el);
          if (out instanceof AsyncMaybe) return await out.value();
          if (out instanceof Maybe) return out.value();
          return out as V;
        }),
      );

      return values.filter((v) => v != null) as V[];
    })();

    return new AsyncMaybe(next);
  }

  first<Us extends ReadonlyArray<AsyncMaybe<unknown> | Maybe<unknown>>>(
    fn: (value: T) => Us,
  ): AsyncMaybe<ExtractMaybeArrayValue<Us>> {
    const next = (async () => {
      const value = await this._value;

      if (isNothing(value)) return value as unknown as ExtractMaybeArrayValue<Us>;

      const maybes = fn(value);

      for (const m of maybes) {
        const maybeValue = await Promise.resolve(m.value());

        if (isJust(maybeValue)) return maybeValue as ExtractMaybeArrayValue<Us>;
      }

      return null as unknown as ExtractMaybeArrayValue<Us>;
    })();

    return new AsyncMaybe(next);
  }

  /**
   * withDefault - Provides a default value if Nothing.
   *
   * @typeParam U - The type of the default value.
   * @param defaultValue - A fallback value.
   * @returns A new AsyncMaybe containing the original or default value.
   */
  withDefault<U>(defaultValue: U): AsyncMaybe<T | U> {
    const next = (async () => {
      const v = await this._value;
      return Maybe.fromNullable(v).withDefault(defaultValue).value();
    })();
    return new AsyncMaybe<T | U>(next);
  }

  /**
   * getOrElse - Provides a default value if Nothing and unwraps the result.
   *
   * @typeParam U - The type of the default value.
   * @param defaultValue - A fallback value.
   * @returns A Promise resolving to the original or default value.
   */
  async getOrElse<U>(defaultValue: U): Promise<T | U> {
    const v = await this._value;
    return Maybe.fromNullable(v).getOrElse(defaultValue);
  }

  /**
   * effect - Executes a side-effect if Just.
   *
   * @param fn - A function to run with the contained value if present.
   * @returns A new AsyncMaybe containing the original value.
   */
  effect(fn: (value: T) => void | Promise<void>): AsyncMaybe<T> {
    const next = (async () => {
      const v = await this._value;
      const m = Maybe.fromNullable(v);
      if (isJust(m.value())) await fn(m.value() as T);
      return v;
    })();
    return new AsyncMaybe(next);
  }

  /**
   * value - Accesses the raw underlying promise.
   *
   * Escape hatch; prefer getOrElse() in most cases.
   *
   * @returns A Promise resolving to the contained value or Nothing.
   */
  value(): Promise<T | null | undefined> {
    return this._value;
  }
}
