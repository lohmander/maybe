// src/utils.ts
function isNothing(value) {
  return value == null;
}
function isJust(value) {
  return !isNothing(value);
}

// src/Maybe.ts
var Maybe = class _Maybe {
  constructor(_value) {
    this._value = _value;
  }
  /**
   * Create a Maybe from a nullable value.
   *
   * @param value - A value that may be null or undefined.
   * @returns A Maybe wrapping the value. Null/undefined become Nothing.
   */
  static fromNullable(value) {
    return new _Maybe(value);
  }
  /**
   * Transform the value if present, otherwise propagate Nothing.
   *
   * @param fn - A function mapping the contained value to a new value.
   * @returns A new Maybe of the mapped value, or Nothing if empty.
   */
  map(fn) {
    if (isNothing(this._value)) return new _Maybe(this._value);
    return new _Maybe(fn(this._value));
  }
  /**
   * Transform the value with a function returning Maybe.
   * If Nothing, propagates Nothing.
   *
   * @param fn - A function mapping the contained value to a Maybe.
   * @returns The resulting Maybe from applying the function, or Nothing if empty.
   */
  flatMap(fn) {
    if (isNothing(this._value)) return new _Maybe(this._value);
    return fn(this._value);
  }
  /**
   * Replace Nothing with a default value, still wrapped in Maybe.
   * Keeps chaining possible.
   *
   * @param defaultValue - The value to use if this is Nothing.
   * @returns A Maybe containing the original or default value.
   */
  withDefault(defaultValue) {
    return isNothing(this._value) ? new _Maybe(defaultValue) : this;
  }
  /**
   * Replace Nothing with a default value and unwrap.
   * Ends the pipeline.
   *
   * @param defaultValue - The value to return if this is Nothing.
   * @returns The contained value if present, otherwise the default.
   */
  getOrElse(defaultValue) {
    return isNothing(this._value) ? defaultValue : this._value;
  }
  /**
   * Run a side-effect if Just; return the same Maybe.
   *
   * @param fn - A function executed with the contained value if present.
   * @returns This Maybe instance, unchanged.
   */
  effect(fn) {
    if (isJust(this._value)) fn(this._value);
    return this;
  }
  filter(predicate) {
    if (isNothing(this._value) || !predicate(this._value)) return new _Maybe(null);
    return new _Maybe(this._value);
  }
  /**
   * Extend an object with a new property if present.
   *
   * @param key - The property name to add.
   * @param fn - A function returning a Maybe of the new property value.
   * @returns A Maybe of the extended object, or Nothing if empty or not an object.
   */
  extend(key, fn) {
    if (isNothing(this._value) || typeof this._value !== "object")
      return new _Maybe(null);
    return this.flatMap(
      (obj) => fn(obj).map((u) => ({ ...obj, [key]: u }))
    );
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
  assign(fns) {
    if (isNothing(this._value) || typeof this._value !== "object") return new _Maybe(null);
    const obj = this._value;
    return Object.entries(fns).reduce(
      (acc, [k, fn]) => acc.flatMap((lastVal) => fn(obj).map((v) => ({ ...lastVal, [k]: v }))),
      new _Maybe(obj)
    );
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
  filterMap(fn) {
    if (isNothing(this._value)) return new _Maybe(null);
    const arr = this._value;
    const result = [];
    for (const el of arr) {
      const maybeVal = fn(el);
      if (!(maybeVal instanceof _Maybe)) return _Maybe.fromNullable(null);
      if (isJust(maybeVal.value())) result.push(maybeVal.value());
    }
    return new _Maybe(result);
  }
  /**
   * Returns the first Maybe to produce a non-Nothing value
   *
   * @typeParam U - The element type of the resulting Maybe.
   * @param fn - A function mapping the contained value to an array of Maybes.
   * @returns The first Maybe<U> from the array, or Nothing if none found or if this is Nothing.
   */
  first(fn) {
    if (isNothing(this._value)) return new _Maybe(null);
    const maybes = fn(this._value);
    for (const m of maybes) {
      if (!(m instanceof _Maybe)) return new _Maybe(null);
      if (isJust(m.value())) return m;
    }
    return new _Maybe(null);
  }
  /**
   * Access the raw inner value.
   *
   * Escape hatch; prefer getOrElse() in most cases.
   *
   * @returns The contained value if present, otherwise null or undefined.
   */
  value() {
    return this._value;
  }
};

// src/AsyncMaybe.ts
var AsyncMaybe = class _AsyncMaybe {
  constructor(_value) {
    this._value = _value;
  }
  /**
   * fromNullable - Creates an AsyncMaybe from a possibly-null/undefined value.
   *
   * @typeParam T - The type of the contained value.
   * @param value - A value that may be null or undefined.
   * @returns An AsyncMaybe wrapping the given value.
   */
  static fromNullable(value) {
    return new _AsyncMaybe(Promise.resolve(value));
  }
  /**
   * fromPromise - Creates an AsyncMaybe from a Promise.
   *
   * @typeParam T - The type of the resolved value.
   * @param promise - A promise resolving to a value that may be null/undefined.
   * @returns An AsyncMaybe wrapping the promise.
   */
  static fromPromise(promise) {
    return new _AsyncMaybe(promise);
  }
  /**
   * fromMaybe - Lifts a synchronous Maybe into an AsyncMaybe.
   *
   * @typeParam T - The type contained by the Maybe.
   * @param maybe - A Maybe instance.
   * @returns An AsyncMaybe wrapping the Maybe’s value.
   */
  static fromMaybe(maybe) {
    return new _AsyncMaybe(Promise.resolve(maybe.value()));
  }
  /**
   * map - Transforms the inner value if present.
   *
   * @typeParam U - The result type of the mapping function.
   * @param fn - A function mapping the contained value.
   * @returns A new AsyncMaybe with the mapped value, or Nothing if absent.
   */
  map(fn) {
    const next = (async () => {
      const v = await this._value;
      return Maybe.fromNullable(v).map(fn).value();
    })();
    return new _AsyncMaybe(next);
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
  flatMap(fn) {
    const next = (async () => {
      const v = await this._value;
      if (isNothing(v)) return v;
      const out = await fn(v);
      if (out instanceof _AsyncMaybe) return await out.value();
      if (out instanceof Maybe) return out.value();
      return out;
    })();
    return new _AsyncMaybe(next);
  }
  // Relax predicate type so user-supplied type predicates work when T is arbitrary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter(predicate) {
    const next = (async () => {
      const v = await this._value;
      if (v == null) {
        return v;
      }
      if (predicate(v)) return v;
      return null;
    })();
    return new _AsyncMaybe(next);
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
  extend(key, fn) {
    return this.filter((v) => typeof v === "object" && v !== null).flatMap(
      (obj) => _AsyncMaybe.fromPromise(
        (async () => {
          const out = await fn(obj);
          const lifted = out instanceof _AsyncMaybe ? out : out instanceof Maybe ? _AsyncMaybe.fromMaybe(out) : _AsyncMaybe.fromNullable(out);
          const newVal = await lifted.value();
          return newVal == null ? null : { ...obj, [key]: newVal };
        })()
      )
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
  assign(fns) {
    return this.flatMap((obj) => {
      if (typeof obj !== "object" || obj === null) return _AsyncMaybe.fromNullable(null);
      const tasks = Object.entries(fns).map(async ([key, fn]) => {
        const res = await Promise.resolve(fn(obj)).then((res2) => res2.value());
        return [key, res];
      });
      return _AsyncMaybe.fromPromise(
        Promise.all(tasks).then((resolved) => {
          if (resolved.some(([, v]) => isNothing(v))) return null;
          return { ...obj, ...Object.fromEntries(resolved) };
        })
      );
    });
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
  filterMap(fn) {
    const next = (async () => {
      const raw = await this._value;
      if (raw == null) return raw;
      if (!Array.isArray(raw)) return null;
      const values = await Promise.all(
        raw.map(async (el) => {
          const out = await fn(el);
          if (out instanceof _AsyncMaybe) return await out.value();
          if (out instanceof Maybe) return out.value();
          return out;
        })
      );
      return values.filter((v) => v != null);
    })();
    return new _AsyncMaybe(next);
  }
  first(fn) {
    const next = (async () => {
      const value = await this._value;
      if (isNothing(value)) return value;
      const maybes = fn(value);
      for (const m of maybes) {
        const maybeValue = await Promise.resolve(m.value());
        if (isJust(maybeValue)) return maybeValue;
      }
      return null;
    })();
    return new _AsyncMaybe(next);
  }
  /**
   * withDefault - Provides a default value if Nothing.
   *
   * @typeParam U - The type of the default value.
   * @param defaultValue - A fallback value.
   * @returns A new AsyncMaybe containing the original or default value.
   */
  withDefault(defaultValue) {
    const next = (async () => {
      const v = await this._value;
      return Maybe.fromNullable(v).withDefault(defaultValue).value();
    })();
    return new _AsyncMaybe(next);
  }
  /**
   * getOrElse - Provides a default value if Nothing and unwraps the result.
   *
   * @typeParam U - The type of the default value.
   * @param defaultValue - A fallback value.
   * @returns A Promise resolving to the original or default value.
   */
  async getOrElse(defaultValue) {
    const v = await this._value;
    return Maybe.fromNullable(v).getOrElse(defaultValue);
  }
  /**
   * effect - Executes a side-effect if Just.
   *
   * @param fn - A function to run with the contained value if present.
   * @returns A new AsyncMaybe containing the original value.
   */
  effect(fn) {
    const next = (async () => {
      const v = await this._value;
      const m = Maybe.fromNullable(v);
      if (isJust(m.value())) await fn(m.value());
      return v;
    })();
    return new _AsyncMaybe(next);
  }
  /**
   * value - Accesses the raw underlying promise.
   *
   * Escape hatch; prefer getOrElse() in most cases.
   *
   * @returns A Promise resolving to the contained value or Nothing.
   */
  value() {
    return this._value;
  }
};

// src/functional.ts
var fromNullable = Maybe.fromNullable;
var fromPromise = AsyncMaybe.fromPromise;
var fromMaybe = AsyncMaybe.fromMaybe;
function map(fn) {
  return ((m) => m.map(fn));
}
function flatMap(fn) {
  return ((m) => m.flatMap(fn));
}
function filter(predicate) {
  return ((m) => m.filter(predicate));
}
function filterMap(fn) {
  return ((m) => m.filterMap(fn));
}
function extend(key, fn) {
  return ((m) => m.extend(key, fn));
}
function assign(fns) {
  return ((m) => m.assign(fns));
}
function withDefault(defaultValue) {
  return ((m) => m.withDefault(defaultValue));
}
function getOrElse(defaultValue) {
  return ((m) => m.getOrElse(defaultValue));
}
function effect(fn) {
  return ((m) => m.effect(fn));
}

export { AsyncMaybe, Maybe, assign, effect, extend, filter, filterMap, flatMap, fromMaybe, fromNullable, fromPromise, getOrElse, map, withDefault };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map