export class Maybe<Just, Nothing = null | undefined> {
  private constructor(private readonly _value: Just | Nothing) {}

  /**
   * from - Creates a Maybe instance from a value that can be of type `Just` or `Nothing` (null or undefined by default).
   *
   * @param value Just | Nothing | Maybe<Just, Nothing> - A value that can be of type `Just` or `Nothing` (null or undefined by default) or another Maybe instance
   * @returns Maybe<Just, Nothing> - An instance of Maybe containing the provided value
   */
  static from<Just>(
    value: Just | null | undefined | Maybe<Just, null | undefined>,
  ): Maybe<Just> {
    if (value instanceof Maybe) {
      return Maybe.from(value.value());
    }

    return new Maybe<Just>(value as Just);
  }

  /**
   * of - Creates a Maybe instance from a value of type `Just`, with the `Nothing` type set to `never`. I.e., the value is always considered to be
   * `Just`, even if it is null or undefined.
   *
   * @param value Just - A value of type `Just`
   * @returns Maybe<Just, never> - An instance of Maybe containing the provided `Just` value, with the `Nothing` type set to `never`
   */
  static of<Just>(value: Just): Maybe<Just, never> {
    return new Maybe<Just, never>(value);
  }

  /**
   * map - Transforms the inner `Just` value using the provided mapping function if it is present.
   *
   * @param fn (value: Just) => U - A map function callback mapping the `Just` value to some other type
   * @returns Maybe<U, Nothing> - A new Maybe instance containing the mapped value or the original `Nothing` value
   */
  public map<U>(fn: (value: Just) => U): Maybe<U, Nothing> {
    if (this._value === null || this._value === undefined) {
      return new Maybe<U, Nothing>(this._value as Nothing);
    }

    return new Maybe<U, Nothing>(fn(this._value as Just));
  }

  /**
   * flatMap - Composes monadic functions by applying the provided function to the inner `Just` value if it is present.
   *
   * @param fn (value: Just) => Maybe<U> - A function that takes a `Just` value and returns a `Maybe<U>`
   * @returns Maybe<U> - The result of applying the function if `Just`, otherwise the original `Nothing`
   */
  public flatMap<U>(fn: (value: Just) => Maybe<U>): Maybe<U> {
    if (this._value === null || this._value === undefined) {
      return new Maybe<U>(this._value as unknown as U);
    }

    return fn(this._value as Just);
  }

  /**
   * filterMap - Maps and filters an array of `U` values contained in a `Maybe` instance.
   * If the `Maybe` instance is `Nothing`, it returns the original `Nothing`.
   * If it is `Just` and contains an array, it applies the provided function to each element,
   * collecting only the `Just` results into a new array.
   *
   * @param this A type guard that makes the method only available on Maybe<U[]>
   * @param fn (value: U) => Maybe<V> - A function that takes a `U` value and returns a `Maybe<V>`
   * @returns Maybe<V[]> - A new Maybe instance containing an array of `V` values or the original `Nothing` value
   */
  public filterMap<U, V>(
    // A type guard that makes the method only available on Maybe<U[]>
    this: Maybe<Just> extends Maybe<U[]> ? Maybe<Just> : never,
    fn: (value: U) => Maybe<V>,
  ): Maybe<V[]> {
    return this.when(Array.isArray).map((arr: U[]) =>
      arr
        .map(fn)
        .map((v) => {
          // Check if v is an instance of Maybe
          if (!(v instanceof Maybe)) {
            throw new Error("filterMap callback must return a Maybe instance");
          }

          return v.value();
        })
        .filter((v) => v !== null && v !== undefined),
    ) as Maybe<V[]>;
  }

  /**
   * extend - Extends an object contained in a `Maybe` instance by adding a new property.
   * If the `Maybe` instance is `Nothing` or does not contain an object, it returns `Nothing`.
   * If it is `Just` and contains an object, it applies the provided function to compute the new property's value,
   * returning a new object with the added property if the function returns `Just`, or `Nothing` if it returns `Nothing`.
   *
   * @param this A type guard that makes the method only available on Maybe<object>
   * @param key string - The key of the new property to add to the object
   * @param fn (value: Just) => Maybe<U> - A function that takes the original object and returns a Maybe<U> for the new property
   * @returns Maybe<Just & { [P in K]: U }> - A new Maybe instance containing the original object extended with the new property, or Nothing if the original value was not an object or the function returned Nothing
   */
  public extend<K extends string, U>(
    this: Maybe<Just, Nothing> extends Maybe<object, Nothing>
      ? Maybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => Maybe<U, any>,
  ): Maybe<Just & { [P in K]: U }> {
    // Short circuit if the original value is not an object
    if (typeof this._value !== "object" && this._value !== null) {
      return Maybe.from<Just & { [P in K]: U }>(undefined);
    }

    // We use flatMap to compose the monadic function.
    return this.flatMap((value) => {
      // flatMap handles the null check, so we know `value` is present.
      const maybeResult = fn(value as Just);

      // Now we use a simple map to add the new property to the object.
      return maybeResult.map((newValue) => ({
        ...(value as Just),
        [key]: newValue,
      })) as Maybe<Just & { [P in K]: U }>;
    });
  }

  /**
   * withDefault - Provides a default value if the `Maybe` instance is `Nothing`.
   * If the instance is `Just`, it retains its original value.
   * The resulting `Maybe` instance will have the `Nothing` type set to `never`,
   * indicating that it can no longer be `Nothing`.
   *
   * @param defaultValue U - A default value to return if the Maybe instance is Nothing
   * @returns Maybe<Just | U, never> - A new Maybe instance containing either the original Just value or the provided default value if it was Nothing, with the Nothing type set to never
   */
  public withDefault<U>(defaultValue: U): Maybe<Just | U, never> {
    return new Maybe<Just | U, never>(
      (this._value ?? defaultValue) as Just | U,
    );
  }

  /**
   * when - Narrows the type of the inner value using a type guard function.
   *
   * @param guard (value: unknown) => value is U - A type guard function that checks if the value is of type U
   * @returns Maybe<U, Nothing | undefined> - A new Maybe instance containing the value if it passes the type guard, or Nothing (null or undefined) if it does not
   */
  public when<U>(guard: (value: unknown) => value is U): Maybe<U> {
    // Use an explicit null/undefined check so falsy but valid values (0, "", false)
    // are not treated as absent.
    const isNothing = this._value === null || this._value === undefined;

    if (isNothing || !guard(this._value as unknown)) {
      // If this._value is Nothing, then return that value, if it is Just but fails the guard, return null
      return Maybe.from<U>(
        isNothing ? (this._value as unknown as U) : undefined,
      );
    }

    return Maybe.from<U>(this._value as unknown as U);
  }

  /**
   * effect - Executes a side-effect function if the `Maybe` instance is `Just`.
   * The original `Maybe` instance is returned for further chaining.
   *
   * @param fn (value: Just) => void - A side-effect function that takes the `Just` value and returns void
   * @returns Maybe<Just, Nothing> - The original Maybe instance for further chaining
   */
  effect(fn: (value: Just) => void): Maybe<Just, Nothing> {
    return this.map((value) => {
      fn(value);
      return value;
    });
  }

  /**
   * value - Retrieves the inner value of the `Maybe` instance.
   *
   * @returns Just | Nothing - The inner value, which can be of type `Just` or `Nothing` (null or undefined)
   */
  public value(): Just | Nothing {
    return this._value;
  }
}
