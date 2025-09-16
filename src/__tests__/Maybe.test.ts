import { describe, it, expect, mock } from "bun:test";

import { Maybe } from "../Maybe";

describe("Maybe", () => {
  it("wraps a present value with fromNullable and returns it with value()", () => {
    const m = Maybe.fromNullable(5);
    expect(m.value()).toBe(5);
  });

  it("represents absent values (null/undefined) and preserves absence through map", () => {
    const m = Maybe.fromNullable<number>(null);
    const mapped = m.map((x) => x * 2);
    expect(mapped.value()).toBeNull();
  });

  describe("fromNullable", () => {
    it("takes a value and wraps it in a Maybe instance", () => {
      const m = Maybe.fromNullable(123);
      expect(m).toBeInstanceOf(Maybe);
    });

    it("takes a null | undefined value and still wraps it in a Maybe instance", () => {
      const mNull = Maybe.fromNullable<number>(null);
      expect(mNull).toBeInstanceOf(Maybe);
      expect(mNull.value()).toBeNull();

      const mUndefined = Maybe.fromNullable<number>(undefined);
      expect(mUndefined).toBeInstanceOf(Maybe);
      expect(mUndefined.value()).toBeUndefined();
    });
  });

  describe("map", () => {
    it("transforms inner value when present", () => {
      const m = Maybe.fromNullable(2).map((n) => n * 3);
      expect(m.value()).toBe(6);
    });

    it("short circuits when no value is present", () => {
      const m = Maybe.fromNullable<number>(null).map((n) => n * 3);
      expect(m.value()).toBeNull();
    });

    it("preserves the concrete Nothing type", () => {
      const m = Maybe.fromNullable<number>(undefined).map((n) => n * 3);
      expect(m.value()).toBeUndefined();

      const m2 = Maybe.fromNullable<number>(null).map((n) => n * 3);
      expect(m2.value()).toBeNull();
    });
  });

  describe("flatMap", () => {
    it("composes monadic functions and returns inner Maybe", () => {
      const m = Maybe.fromNullable(3).flatMap((n) => Maybe.fromNullable(n + 4));
      expect(m.value()).toBe(7);
    });

    it("short circuits when no value is present", () => {
      const m = Maybe.fromNullable<number>(null).flatMap((n) => Maybe.fromNullable(n + 4));
      expect(m.value()).toBeNull();
    });

    it("passes down the Nothing value as is", () => {
      const m = Maybe.fromNullable<number>(undefined).flatMap((n) => Maybe.fromNullable(n + 4));
      expect(m.value()).toBeUndefined();
    });
  });

  describe("withDefault", () => {
    it("supplies a default when value is null/undefined", () => {
      const absent = Maybe.fromNullable<number>(null).withDefault(42);
      expect(absent.value()).toBe(42);

      const present = Maybe.fromNullable(10).withDefault(42);
      expect(present.value()).toBe(10);
    });

    it("supplies a default value for further chaining", () => {
      const result = Maybe.fromNullable<number>(null)
        .withDefault(5) // default to 5
        .map((x) => x * 2)
        .value();
      expect(result).toBe(10);
    });
  });

  describe("filter", () => {
    it("narrows value with a type guard and returns Nothing when guard fails", () => {
      const isNumber = (v: unknown): v is number => typeof v === "number";

      const num = Maybe.fromNullable(7).filter(isNumber);
      expect(num.value()).toBe(7);

      const notNum = Maybe.fromNullable("str").filter(isNumber);
      expect(notNum.value()).toBeNull();
    });

    it("keeps value if predicate passes", () => {
      const gt3 = (n: number) => n > 3;
      const kept = Maybe.fromNullable(5).filter(gt3);
      expect(kept.value()).toBe(5);

      const dropped = Maybe.fromNullable(2).filter(gt3);
      expect(dropped.value()).toBeNull();
    });
  });

  describe("extend", () => {
    it("adds a computed property to an object when present", () => {
      const original = { num: 2 };
      const result = Maybe.fromNullable(original)
        .extend("greet", (o) => Maybe.fromNullable(`Hello ${o.num}`))
        .value();

      expect(result).toEqual({ num: 2, greet: "Hello 2" });
    });

    it("short circuits if the `Just` value is not an object", () => {
      const result = Maybe.fromNullable(5)
        // @ts-expect-error
        .extend("greet", (o) => Maybe.fromNullable(`Hello ${o.num}`))
        .value();

      expect(result).toBeNull();
    });

    it("short circuits if the function returns Nothing", () => {
      const original = { num: 2 };
      const result = Maybe.fromNullable(original)
        .extend("greet", () => Maybe.fromNullable<string>(undefined))
        .value();

      expect(result).toBeUndefined();
    });
  });

  describe("assign", () => {
    it("assigns a single property", () => {
      const user = Maybe.fromNullable({ id: 1, name: "Alice" });

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
      });

      expect(result.value()).toEqual({
        id: 1,
        name: "Alice",
        profile: "ALICE",
      });
    });

    it("assigns multiple properties in one call", () => {
      const user = Maybe.fromNullable({ id: 2, name: "Bob" });

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
        settings: () => Maybe.fromNullable("dark"),
      });

      expect(result.value()).toEqual({
        id: 2,
        name: "Bob",
        profile: "BOB",
        settings: "dark",
      });
    });

    it("short-circuits to Nothing if the Maybe is Nothing", () => {
      const user = Maybe.fromNullable<{ id: number; name: string }>(null);

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name.toUpperCase()),
      });

      expect(result.value()).toBeNull();
    });

    it("short-circuits to Nothing if the inner value is not an object", () => {
      const notObj = Maybe.fromNullable(42);

      const result = notObj.assign({
        profile: () => Maybe.fromNullable("oops"),
      });

      expect(result.value()).toBeNull();
    });

    it("short-circuits to Nothing if any property function returns Nothing", () => {
      const user = Maybe.fromNullable({ id: 3, name: "Charlie" });

      const result = user.assign({
        profile: () => Maybe.fromNullable(null), // Nothing
        settings: () => Maybe.fromNullable("light"),
      });

      expect(result.value()).toBeNull();
    });

    it("allows chaining with map after assign", () => {
      const user = Maybe.fromNullable({ id: 4, name: "Diana" });

      const result = user
        .assign({
          profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
        })
        .map((u) => u.profile + "!");

      expect(result.value()).toBe("DIANA!");
    });
  });

  describe("filterMap", () => {
    it("maps an array of items to Maybe and filters out Nothing/null/undefined results", () => {
      const arr = [{ greet: "a" }, { greet: "b" }];
      const maybeArr = Maybe.fromNullable(arr)
        .filterMap((x) => Maybe.fromNullable(x.greet))
        .value();

      expect(maybeArr).toEqual(["a", "b"]);
    });

    it("fails if the result of the filterMap callback does not return a Maybe instance", () => {
      const arr = [{ greet: "a" }, { greet: "b" }];
      const maybeArr = Maybe.fromNullable(arr)
        // @ts-expect-error
        .filterMap((x) => x.greet) // Incorrect: should return Maybe
        .value();

      expect(maybeArr).toBeNull();
    });
  });

  describe("effect", () => {
    it("calls a function with the value and ignores its result", () => {
      const effectFn = mock((x: number) => {});
      const result = Maybe.fromNullable(10)
        .effect(effectFn)
        .map((x) => x * 2)
        .value();

      expect(result).toBe(20);
      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(effectFn).toHaveBeenCalledWith(10);
    });

    it("does not call a function when the value is Nothing", () => {
      const effectFn = mock((x: number) => {});
      const result = Maybe.fromNullable<number>(null).effect(effectFn).value();

      expect(result).toBeNull();
      expect(effectFn).toHaveBeenCalledTimes(0);
    });
  });

  it("complex chaining example behaves as expected", () => {
    const x: number | null = 10;
    const result = Maybe.fromNullable(x)
      .map((x) => x * 2) // 20
      .withDefault(0) // still 20
      .map((num) => ({ num })) // { num: 20 }
      .extend("greet", (x) => Maybe.fromNullable(`Hello ${x.num}`)) // { num:20, greet: "Hello 20" }
      .map(Array.of) // [{ num:20, greet: "Hello 20" }]
      .filterMap((x) => Maybe.fromNullable(x).map((y) => y.greet)) // ["Hello 20"]
      .withDefault([] as string[])
      .value();

    expect(result).toEqual(["Hello 20"]);
  });
});
