/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtractMaybeArrayValue, ReturnMaybeType } from "./types";
import { isJust, isNothing } from "./utils";

/**
 * Maybe<T> - A container for optional values.
 *
 * Represents either:
 *  - Just<T>: a present value of type T
 *  - Nothing: absence of value (null or undefined)
 *
 * Inspired by functional programming but designed for JS/TS ergonomics.
 */
export class Maybe<T> {
  private constructor(public readonly _value: T | null | undefined) {}

  /**
   * Create a Maybe from a nullable value.
   *
   * @param value - A value that may be null or undefined.
   * @returns A Maybe wrapping the value. Null/undefined become Nothing.
   */
  static fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return new Maybe(value);
  }

  /**
   * Transform the value if present, otherwise propagate Nothing.
   *
   * @param fn - A function mapping the contained value to a new value.
   * @returns A new Maybe of the mapped value, or Nothing if empty.
   */
  map<U>(fn: (value: T) => U): Maybe<U> {
    if (isNothing(this._value)) return new Maybe<U>(this._value);
    return new Maybe(fn(this._value as T));
  }

  /**
   * Transform the value with a function returning Maybe.
   * If Nothing, propagates Nothing.
   *
   * @param fn - A function mapping the contained value to a Maybe.
   * @returns The resulting Maybe from applying the function, or Nothing if empty.
   */
  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    if (isNothing(this._value)) return new Maybe<U>(this._value);
    return fn(this._value as T);
  }

  /**
   * Replace Nothing with a default value, still wrapped in Maybe.
   * Keeps chaining possible.
   *
   * @param defaultValue - The value to use if this is Nothing.
   * @returns A Maybe containing the original or default value.
   */
  withDefault<U>(defaultValue: U): Maybe<T | U> {
    return isNothing(this._value) ? new Maybe(defaultValue) : this;
  }

  /**
   * Replace Nothing with a default value and unwrap.
   * Ends the pipeline.
   *
   * @param defaultValue - The value to return if this is Nothing.
   * @returns The contained value if present, otherwise the default.
   */
  getOrElse<U>(defaultValue: U): T | U {
    return isNothing(this._value) ? defaultValue : (this._value as T);
  }

  /**
   * Run a side-effect if Just; return the same Maybe.
   *
   * @param fn - A function executed with the contained value if present.
   * @returns This Maybe instance, unchanged.
   */
  effect(fn: (value: T) => void): Maybe<T> {
    if (isJust(this._value)) fn(this._value as T);
    return this;
  }

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
  filter(predicate: ((value: T) => boolean) | ((value: T) => value is any)): Maybe<any> {
    if (isNothing(this._value) || !predicate(this._value as T)) return new Maybe<any>(null);

    return new Maybe<any>(this._value);
  }

  /**
   * Extend an object with a new property if present.
   *
   * @param key - The property name to add.
   * @param fn - A function returning a Maybe of the new property value.
   * @returns A Maybe of the extended object, or Nothing if empty or not an object.
   */
  extend<K extends string, U>(key: K, fn: (value: T) => Maybe<U>): Maybe<T & { [P in K]: U }> {
    if (isNothing(this._value) || typeof this._value !== "object")
      return new Maybe<T & { [P in K]: U }>(null);

    // Use a broadly-typed approach here to keep the API ergonomic.

    return this.flatMap((obj: any) =>
      fn(obj).map((u: any) => ({ ...(obj as any), [key]: u })),
    ) as any;
  }

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
  assign<Exts extends Record<string, (value: T) => Maybe<any>>>(
    fns: Exts,
  ): Maybe<
    T & {
      [K in keyof Exts]: ReturnMaybeType<Exts[K]>;
    }
  > {
    if (isNothing(this._value) || typeof this._value !== "object") return new Maybe<any>(null);

    const obj = this._value as T;

    return Object.entries(fns).reduce(
      (acc: any, [k, fn]: [string, (v: T) => Maybe<any>]) =>
        acc.flatMap((lastVal: any) => fn(obj).map((v: any) => ({ ...lastVal, [k]: v }))),
      new Maybe(obj),
    ) as any;
  }

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
  filterMap<U, V>(this: Maybe<U[]>, fn: (value: U) => Maybe<V>): Maybe<V[]> {
    if (isNothing(this._value)) return new Maybe<V[]>(null);

    const arr = this._value as U[];
    const result: V[] = [];

    for (const el of arr) {
      const maybeVal = fn(el);
      if (!(maybeVal instanceof Maybe)) return Maybe.fromNullable<V[]>(null);

      if (isJust(maybeVal.value())) result.push(maybeVal.value() as V);
    }

    return new Maybe(result);
  }

  /**
   * Returns the first Maybe to produce a non-Nothing value
   *
   * @typeParam U - The element type of the resulting Maybe.
   * @param fn - A function mapping the contained value to an array of Maybes.
   * @returns The first Maybe<U> from the array, or Nothing if none found or if this is Nothing.
   */
  first<Us extends ReadonlyArray<Maybe<any>>>(
    fn: (value: T) => Us,
  ): Maybe<ExtractMaybeArrayValue<Us>> {
    if (isNothing(this._value)) return new Maybe<ExtractMaybeArrayValue<Us>>(null);

    const maybes = fn(this._value as T);

    for (const m of maybes) {
      if (!(m instanceof Maybe)) return new Maybe<ExtractMaybeArrayValue<Us>>(null);
      if (isJust(m.value())) return m;
    }

    return new Maybe<ExtractMaybeArrayValue<Us>>(null);
  }

  /**
   * Access the raw inner value.
   *
   * Escape hatch; prefer getOrElse() in most cases.
   *
   * @returns The contained value if present, otherwise null or undefined.
   */
  value(): T | null | undefined {
    return this._value;
  }
}
