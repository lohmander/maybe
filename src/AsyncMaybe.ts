import { Maybe } from "./Maybe";

export class AsyncMaybe<
  Just,
  Nothing extends null | undefined = null | undefined,
> {
  private constructor(private readonly _value: Promise<Just | Nothing>) {}

  static from<Just>(value: AsyncMaybe<Just>): AsyncMaybe<Just>;
  static from<Just>(value: Maybe<Just>): AsyncMaybe<Just>;
  static from<Just>(value: Promise<Just | null | undefined>): AsyncMaybe<Just>;
  static from<Just>(value: Just | null | undefined): AsyncMaybe<Just>;
  static from<Just>(value: any): AsyncMaybe<Just> {
    let promise: Promise<Just | null | undefined>;

    if (value instanceof Maybe) {
      promise = Promise.resolve(value.value());
    } else if (value instanceof AsyncMaybe) {
      promise = value.value();
    } else {
      promise = Promise.resolve(value);
    }

    return new AsyncMaybe<Just>(promise);
  }

  static of<Just>(value: Just | Promise<Just>): AsyncMaybe<Just, never> {
    return new AsyncMaybe<Just, never>(Promise.resolve(value));
  }

  map<U>(fn: (value: Just) => U): AsyncMaybe<U> {
    return AsyncMaybe.from<U>(
      this.value().then((value) => Maybe.from<Just>(value).map(fn).value()),
    );
  }

  flatMap<U>(
    fn: (
      value: Just,
    ) =>
      | AsyncMaybe<U>
      | Maybe<U>
      | Promise<AsyncMaybe<U> | Maybe<U>>
      | Promise<AsyncMaybe<U> | Maybe<U> | U>,
  ): AsyncMaybe<U> {
    const next = this.value().then(async (value) => {
      // If current is Nothing, propagate it
      if (value === null || value === undefined) {
        return value as unknown as U;
      }

      // Call the mapper and normalize to a resolved value
      const maybeLike = await Promise.resolve(fn(value as Just));

      // If the mapper returned an AsyncMaybe, unwrap its inner Promise result
      if (maybeLike instanceof AsyncMaybe) {
        return (await maybeLike.value()) as U;
      }

      // If the mapper returned a synchronous Maybe, unwrap its value
      if (maybeLike instanceof Maybe) {
        return maybeLike.value() as U;
      }

      // Otherwise assume it's a plain value
      return maybeLike as unknown as U;
    });

    return AsyncMaybe.from<U>(next);
  }

  filterMap<U, V>(
    // A type guard that makes the method only available on AsyncMaybe<U[]>
    this: AsyncMaybe<Just> extends AsyncMaybe<U[]> ? AsyncMaybe<Just> : never,
    fn: (value: U) => AsyncMaybe<V> | Maybe<V>,
  ): AsyncMaybe<V[]> {
    return AsyncMaybe.from<V[]>(
      this.value().then(async (value) => {
        if (!Array.isArray(value)) {
          if (value === null || value === undefined) {
            return value;
          }

          return undefined;
        }

        const values = await Promise.all(
          value
            .map(fn)
            .map(AsyncMaybe.from)
            .map((am) => am.value()),
        );

        return values.filter(
          (value) => value !== null && value !== undefined,
        ) as V[];
      }),
    );
  }

  public extend<K extends string, U>(
    this: AsyncMaybe<Just, Nothing> extends AsyncMaybe<object, Nothing>
      ? AsyncMaybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => Maybe<U>,
  ): AsyncMaybe<Just & { [P in K]: U }>;
  public extend<K extends string, U>(
    this: AsyncMaybe<Just, Nothing> extends AsyncMaybe<object, Nothing>
      ? AsyncMaybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => AsyncMaybe<U>,
  ): AsyncMaybe<Just & { [P in K]: U }>;
  public extend<K extends string, U>(
    this: AsyncMaybe<Just, Nothing> extends AsyncMaybe<object, Nothing>
      ? AsyncMaybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => Promise<AsyncMaybe<U>>,
  ): AsyncMaybe<Just & { [P in K]: U }>;
  public extend<K extends string, U>(
    this: AsyncMaybe<Just, Nothing> extends AsyncMaybe<object, Nothing>
      ? AsyncMaybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => Promise<Maybe<U>>,
  ): AsyncMaybe<Just & { [P in K]: U }>;
  public extend<K extends string, U>(
    this: AsyncMaybe<Just, Nothing> extends AsyncMaybe<object, Nothing>
      ? AsyncMaybe<Just, Nothing>
      : never,
    key: K,
    fn: (value: Just) => any,
  ): AsyncMaybe<Just & { [P in K]: U }> {
    return (
      // First, we narrow to only object values.
      this.when((value) => typeof value === "object" && value !== null)

        // We use flatMap to compose the monadic function.
        .flatMap((value) => {
          // flatMap handles the null check, so we know `value` is present.
          const maybeResult = AsyncMaybe.from(fn(value as Just));

          // Now we use a simple map to add the new property to the object.
          return maybeResult.map((newValue) => ({
            ...(value as Just),
            [key]: newValue,
          })) as AsyncMaybe<Just & { [P in K]: U }>;
        })
    );
  }

  withDefault(defaultValue: Just): AsyncMaybe<Just, never> {
    return new AsyncMaybe<Just, never>(
      this.value().then((value) =>
        Maybe.from<Just>(value).withDefault(defaultValue).value(),
      ),
    );
  }

  when<U>(guard: (value: unknown) => value is U): AsyncMaybe<U> {
    return AsyncMaybe.from<U>(
      this.value().then((value) => Maybe.from<Just>(value).when(guard).value()),
    );
  }

  effect(fn: (value: Just) => void): AsyncMaybe<Just> {
    return this.map((value) => {
      fn(value);
      return value;
    });
  }

  async value(): Promise<Just | Nothing> {
    return this._value;
  }
}
