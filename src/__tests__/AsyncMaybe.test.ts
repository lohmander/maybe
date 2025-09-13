import { describe, it, expect, mock } from "bun:test";
import { AsyncMaybe } from "../AsyncMaybe";
import { Maybe } from "../Maybe";

describe("AsyncMaybe", () => {
  describe("from", () => {
    it("takes a Promise value and wraps it in an AsyncMaybe instance", () => {
      const promise = Promise.resolve(123);
      const m = AsyncMaybe.from(promise);
      expect(m).toBeInstanceOf(AsyncMaybe);
    });

    it("takes an arbitrary value and wraps it in an AsyncMaybe instance", () => {
      const m = AsyncMaybe.from(456);
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(m.value()).resolves.toBe(456);
    });

    it("takes a Maybe value and lifts it into an AsyncMaybe instance", () => {
      const maybe = Maybe.from(789);
      const m = AsyncMaybe.from(maybe);
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(m.value()).resolves.toBe(789);
    });

    it("takes an AsyncMaybe value and returns a new AsyncMaybe with its value", () => {
      const original = AsyncMaybe.from(101112);
      const m = AsyncMaybe.from(original);
      expect(m).toEqual(original);
      expect(m).not.toBe(original);
    });
  });

  describe("of", () => {
    it("wraps a Just value in an AsyncMaybe instance", () => {
      const m = AsyncMaybe.of(42);
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(m.value()).resolves.toBe(42);
    });

    it("wraps a Promise<Just> value in an AsyncMaybe instance", () => {
      const m = AsyncMaybe.of(Promise.resolve(84));
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(m.value()).resolves.toBe(84);
    });

    it("treats null or undefined as Just when using of", () => {
      const mNull = AsyncMaybe.of<number | null>(null);
      expect(mNull).toBeInstanceOf(AsyncMaybe);
      expect(mNull.value()).resolves.toBeNull();

      const mUndefined = AsyncMaybe.of<number | undefined>(undefined);
      expect(mUndefined).toBeInstanceOf(AsyncMaybe);
      expect(mUndefined.value()).resolves.toBeUndefined();
    });
  });

  describe("map", () => {
    it("applies the map function to the resolved value", async () => {
      const promise = Promise.resolve(5);
      const m = AsyncMaybe.from(promise).map((x) => x * 2);
      const value = await m.value();
      expect(value).toBe(10);
    });

    it("short circuits if the value is Nothing", async () => {
      const promise = Promise.resolve<number | null>(null);
      const m = AsyncMaybe.from(promise).map((x) => x * 2);
      const value = await m.value();
      expect(value).toBeNull();
    });
  });

  describe("flatMap", () => {
    it("applies the flatMap function and flattens the result", async () => {
      const promise = Promise.resolve(3);
      const m = AsyncMaybe.from(promise).flatMap((x) => AsyncMaybe.from(x * 4));
      const value = await m.value();
      expect(value).toBe(12);
    });

    it("short circuits if the value is Nothing", async () => {
      const promise = Promise.resolve<number | null>(null);
      const m = AsyncMaybe.from<number>(promise).flatMap((x) =>
        AsyncMaybe.from(x * 4),
      );
      const value = await m.value();
      expect(value).toBeNull();
    });

    it("handles flatMap functions that return synchronous Maybe instances", async () => {
      const promise = Promise.resolve(7);
      const m = AsyncMaybe.from(promise).flatMap((x) => Maybe.from(x + 1));
      const value = await m.value();
      expect(value).toBe(8);
    });

    it("handles flatMap function that return a Promise<Maybe<T>>", async () => {
      const promise = Promise.resolve(10);
      const m = AsyncMaybe.from(promise).flatMap((x) =>
        Promise.resolve(Maybe.from(x + 5)),
      );
      const value = await m.value();
      expect(value).toBe(15);
    });

    it("handles flatMap function that return a Promise<AsyncMaybe<T>>", async () => {
      const promise = Promise.resolve(20);
      const m = AsyncMaybe.from(promise).flatMap((x) =>
        Promise.resolve(AsyncMaybe.from(x + 10)),
      );
      const value = await m.value();
      expect(value).toBe(30);
    });
  });

  describe("filterMap", () => {
    it("applies the filterMap function to each element in an array, keeping only elements where the Maybe<T> is Just", async () => {
      const promise = Promise.resolve([1, 2, 3, 4, 5]);
      const m = AsyncMaybe.from(promise).filterMap((x) =>
        x % 2 === 0 ? Maybe.from(x * 10) : Maybe.from<number | null>(null),
      );
      const value = await m.value();
      expect(value).toEqual([20, 40]);
    });

    it("applies the filterMap function to each element in an array with AsyncMaybe return, keeping only elements where the AsyncMaybe is Just", async () => {
      const promise = Promise.resolve([1, 2, 3, 4, 5]);
      const m = AsyncMaybe.from(promise).filterMap((x) =>
        x % 2 === 0
          ? AsyncMaybe.from(x * 10)
          : AsyncMaybe.from<number | null>(null),
      );
      const value = await m.value();
      expect(value).toEqual([20, 40]);
    });

    it("short circuits if the value is Nothing", async () => {
      const promise = Promise.resolve<number[] | null>(null);
      const m = AsyncMaybe.from<number[]>(promise).filterMap((x) =>
        Maybe.from(x * 10),
      );
      expect(m.value()).resolves.toBeNull();

      // Also undefined
      const promise2 = Promise.resolve<number[] | undefined>(undefined);
      const m2 = AsyncMaybe.from<number[]>(promise2).filterMap((x) =>
        Maybe.from(x * 10),
      );
      expect(m2.value()).resolves.toBeUndefined();
    });

    it("returns undefined if the value is not an Array", () => {
      const promise = Promise.resolve(123);
      // @ts-expect-error
      const m = AsyncMaybe.from(promise).filterMap((x) => Maybe.from(x));
      return expect(m.value()).resolves.toBeUndefined();
    });
  });

  describe("extend", () => {
    it("adds a computed property to an object when present", async () => {
      const promise = Promise.resolve({ num: 3 });
      const m = AsyncMaybe.from(promise).extend("greet", (o) =>
        AsyncMaybe.from(`Hello ${o.num}`),
      );
      const value = await m.value();
      expect(value).toEqual({ num: 3, greet: "Hello 3" });
    });

    it("short circuits if the `Just` value is not an object", async () => {
      const promise = Promise.resolve(5);
      // @ts-expect-error
      const m = AsyncMaybe.from(promise).extend("greet", (o) =>
        // @ts-expect-error
        AsyncMaybe.from(`Hello ${o.num}`),
      );
      const value = await m.value();
      expect(value).toBeUndefined();
    });

    it("does not confuse null for an object", () => {
      const promise = Promise.resolve(null);
      // @ts-expect-error
      const m = AsyncMaybe.from(promise).extend("greet", (o) =>
        // @ts-expect-error
        AsyncMaybe.from(`Hello ${o.num}`),
      );
      return expect(m.value()).resolves.toBeNull();
    });

    it("supports chaining", () => {
      const promise = Promise.resolve({ a: 1 });
      const m = AsyncMaybe.from(promise)
        .extend("b", (o) => AsyncMaybe.from(o.a + 1))
        .extend("c", (o) => Maybe.from(o.b + 1));
      return expect(m.value()).resolves.toEqual({ a: 1, b: 2, c: 3 });
    });

    it("short circuits if the function returns Nothing", async () => {
      const promise = Promise.resolve({ num: 2 });
      const m = AsyncMaybe.from(promise)
        .extend("greet", (o) => AsyncMaybe.from<string>(null))
        .map((obj) => `${obj.greet} stranger!`);
      const value = await m.value();
      expect(value).toBeNull();
    });
  });

  describe("withDefault", () => {
    it("supplies a default value if the AsyncMaybe is Nothing", async () => {
      const absent = AsyncMaybe.from<number | null>(
        Promise.resolve(null),
      ).withDefault(42);
      expect(absent.value()).resolves.toBe(42);
    });

    it("doesn't do anything if the AsyncMaybe is Just", () => {
      const present = AsyncMaybe.from(Promise.resolve(10)).withDefault(42);
      return expect(present.value()).resolves.toBe(10);
    });
  });

  describe("when", () => {
    it("narrows value with a type guard", async () => {
      const isNumber = (v: unknown): v is number => typeof v === "number";

      const num = AsyncMaybe.from(7).when(isNumber);
      expect(num.value()).resolves.toBe(7);
    });

    it("returns undefined when guard fails", () => {
      const isNumber = (v: unknown): v is number => typeof v === "number";

      const notNum = AsyncMaybe.from("str").when(isNumber);
      return expect(notNum.value()).resolves.toBeUndefined();
    });
  });

  describe("effect", () => {
    it("runs a side-effect function if the value is Just", async () => {
      const fn = mock(() => {});
      const m = AsyncMaybe.from(Promise.resolve(11)).effect(fn);
      expect(fn).not.toHaveBeenCalled();
      await m.value();
      expect(fn).toHaveBeenCalledWith(11);
    });

    it("does not run the side-effect function if the value is Nothing", async () => {
      const fn = mock(() => {});
      const m = AsyncMaybe.from<number | null>(Promise.resolve(null)).effect(
        fn,
      );
      expect(fn).not.toHaveBeenCalled();
      await m.value();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("value", () => {
    it("returns the underlying Promise value", async () => {
      const promise = Promise.resolve(456);
      const m = AsyncMaybe.from(promise);
      const value = await m.value();
      expect(value).toBe(456);
    });
  });
});
