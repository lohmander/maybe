import { describe, it, expect, mock } from "bun:test";
import { Maybe } from "../Maybe";

describe("Maybe", () => {
  it("wraps a present value with from and returns it with value()", () => {
    const m = Maybe.from(5);
    expect(m.value()).toBe(5);
  });

  it("represents absent values (null/undefined) and preserves absence through map", () => {
    const m = Maybe.from<number>(null);
    const mapped = m.map((x) => x * 2);
    expect(mapped.value()).toBeNull();
  });

  describe("from", () => {
    it("takes a value and wraps it in a Maybe instance", () => {
      const m = Maybe.from(123);
      expect(m).toBeInstanceOf(Maybe);
    });

    it("takes a null | undefined value and still wraps it in a Maybe instance", () => {
      const mNull = Maybe.from<number>(null);
      expect(mNull).toBeInstanceOf(Maybe);
      expect(mNull.value()).toBeNull();
    });

    it("it takes another Maybe instance and flattens it", () => {
      const inner = Maybe.from(42);
      const outer = Maybe.from(inner);
      expect(outer).toBeInstanceOf(Maybe);
      expect(outer.value()).toBe(42);
    });
  });

  describe("of", () => {
    it("always treats the value as Just, even if it's null or undefined", () => {
      const mNull = Maybe.of<number | null>(null);
      expect(mNull.value()).toBeNull();

      const mUndefined = Maybe.of<number | undefined>(undefined);
      expect(mUndefined.value()).toBeUndefined();
    });

    it("wraps any input value in a Maybe instance", () => {
      const m = Maybe.of(10 as number | null);
      expect(m.value()).toBe(10);
    });
  });

  describe("map", () => {
    it("map transforms inner value when present", () => {
      const m = Maybe.from(2).map((n) => n * 3);
      expect(m.value()).toBe(6);
    });

    it("short circuits when no value is present", () => {
      const m = Maybe.from<number>(null).map((n) => n * 3);
      expect(m.value()).toBeNull();
    });

    it("preserves the concrete Nothing type", () => {
      const m = Maybe.from<number>(undefined).map((n) => n * 3);
      expect(m.value()).toBeUndefined();

      const m2 = Maybe.from<number>(null).map((n) => n * 3);
      expect(m2.value()).toBeNull();
    });
  });

  describe("flatMap", () => {
    it("composes monadic functions and returns inner Maybe", () => {
      const m = Maybe.from(3).flatMap((n) => Maybe.from(n + 4));
      expect(m.value()).toBe(7);
    });

    it("short circuits when no value is present", () => {
      const m = Maybe.from<number>(null).flatMap((n) => Maybe.from(n + 4));
      expect(m.value()).toBeNull();
    });

    it("passes down the Nothing value as is", () => {
      const m = Maybe.from<number>(undefined).flatMap((n) => Maybe.from(n + 4));
      expect(m.value()).toBeUndefined();
    });
  });

  describe("withDefault", () => {
    it("supplies a default when value is null/undefined", () => {
      const absent = Maybe.from<number>(null).withDefault(42);
      // withDefault changes the Nothing type to never, so value() is the default
      expect(absent.value()).toBe(42);

      const present = Maybe.from(10).withDefault(42);
      expect(present.value()).toBe(10);
    });

    it("supplies a default value for further chaining", () => {
      const result = Maybe.from<number>(null)
        .withDefault(5) // default to 5
        .map((x) => x * 2)
        .value();
      expect(result).toBe(10);
    });
  });

  describe("when", () => {
    it("narrows value with a type guard and returns null when guard fails", () => {
      const isNumber = (v: unknown): v is number => typeof v === "number";

      const num = Maybe.from(7).when(isNumber);
      expect(num.value()).toBe(7);

      const notNum = Maybe.from("str").when(isNumber);
      expect(notNum.value()).toBeUndefined();
    });
  });

  describe("extend", () => {
    it("adds a computed property to an object when present", () => {
      const original = { num: 2 };
      const result = Maybe.from(original)
        .extend("greet", (o) => Maybe.from(`Hello ${o.num}`))
        .value();

      // result should be the original object extended with greet
      expect(result).toEqual({ num: 2, greet: "Hello 2" });
    });

    it("short circuits if the `Just` value is not an object", () => {
      const result =
        // @ts-expect-error
        Maybe.from(5)
          // @ts-expect-error
          .extend("greet", (o) => Maybe.from(`Hello ${o.num}`))
          .value();

      expect(result).toBeUndefined();
    });

    it("short circuits if the function returns Nothing", () => {
      const original = { num: 2 };
      const result = Maybe.from(original)
        .extend("greet", (o) => Maybe.from<string>(undefined))
        .value();

      expect(result).toBeUndefined();
    });
  });

  describe("filterMap", () => {
    it("maps an array of items to Maybe and filters out Nothing/null/undefined results", () => {
      // Start with an array of objects that have a 'greet' property
      const arr = [{ greet: "a" }, { greet: "b" }];
      const maybeArr = Maybe.from(arr)
        .filterMap((x) => Maybe.from(x.greet))
        .value();

      expect(maybeArr).toEqual(["a", "b"]);
    });

    it("fails if the result of the filterMap callback does not return a Maybe instance", () => {
      const arr = [{ greet: "a" }, { greet: "b" }];
      expect(() => {
        Maybe.from(arr)
          // @ts-expect-error
          .filterMap((x) => x.greet) // Incorrect: should return Maybe
          .value();
      }).toThrow("filterMap callback must return a Maybe instance");
    });
  });

  describe("effect", () => {
    it("calls a function with the value and ignores its result", () => {
      const effectFn = mock((x: number) => {
        // side effect
      });

      const result = Maybe.from(10)
        .effect(effectFn) // should call effectFn with 10
        .map((x) => x * 2) // continue chaining
        .value();

      expect(result).toBe(20);
      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(effectFn).toHaveBeenCalledWith(10);
    });

    it("it does not call a function when the value is Nothing", () => {
      const effectFn = mock((x: number) => {
        // side effect
      });

      const result = Maybe.from<number>(null)
        .effect(effectFn) // should not call effectFn
        .value();

      expect(result).toBeNull();
      expect(effectFn).toHaveBeenCalledTimes(0);
    });
  });

  it("complex chaining example behaves as expected", () => {
    const x: number | null = 10;
    const result = Maybe.from(x)
      .map((x) => x * 2) // 20
      .withDefault(0) // still 20
      .map((num) => ({ num })) // { num: 20 }
      .extend("greet", (x) => Maybe.from(`Hello ${x.num}`)) // { num:20, greet: "Hello 20" }
      .map(Array.of) // [{ num:20, greet: "Hello 20" }]
      .filterMap((x) => Maybe.from(x).map((y) => y.greet)) // ["Hello 20"]
      .withDefault([] as string[])
      .value();

    expect(result).toEqual(["Hello 20"]);
  });
});
