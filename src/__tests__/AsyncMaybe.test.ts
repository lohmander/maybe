import { describe, it, expect, mock } from "bun:test";

import { AsyncMaybe } from "../AsyncMaybe";
import { Maybe } from "../Maybe";

describe("AsyncMaybe", () => {
  describe("constructors", () => {
    it("fromNullable wraps a sync value", async () => {
      const m = AsyncMaybe.fromNullable(123);
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(await m.value()).toBe(123);
    });

    it("fromNullable wraps null/undefined as Nothing", async () => {
      const mNull = AsyncMaybe.fromNullable<number>(null);
      expect(await mNull.value()).toBeNull();

      const mUndef = AsyncMaybe.fromNullable<number>(undefined);
      expect(await mUndef.value()).toBeUndefined();
    });

    it("fromPromise wraps a promise value", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(456));
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(await m.value()).toBe(456);
    });

    it("fromMaybe lifts a Maybe", async () => {
      const maybe = Maybe.fromNullable(789);
      const m = AsyncMaybe.fromMaybe(maybe);
      expect(m).toBeInstanceOf(AsyncMaybe);
      expect(await m.value()).toBe(789);
    });
  });

  describe("map", () => {
    it("applies the map function to the resolved value", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(5)).map((x) => x * 2);
      expect(await m.value()).toBe(10);
    });

    it("short circuits if the value is Nothing", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve<number | null>(null)).map((x) => x * 2);
      expect(await m.value()).toBeNull();
    });
  });

  describe("flatMap", () => {
    it("applies the flatMap function and flattens the result", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(3)).flatMap((x) =>
        AsyncMaybe.fromNullable(x * 4),
      );
      expect(await m.value()).toBe(12);
    });

    it("short circuits if the value is Nothing", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve<number | null>(null)).flatMap((x) =>
        AsyncMaybe.fromNullable(x * 4),
      );
      expect(await m.value()).toBeNull();
    });

    it("handles flatMap functions returning Maybe", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(7)).flatMap((x) =>
        Maybe.fromNullable(x + 1),
      );
      expect(await m.value()).toBe(8);
    });

    it("handles flatMap functions returning Promise<Maybe>", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(10)).flatMap((x) =>
        Promise.resolve(Maybe.fromNullable(x + 5)),
      );
      expect(await m.value()).toBe(15);
    });

    it("handles flatMap functions returning Promise<AsyncMaybe>", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(20)).flatMap((x) =>
        Promise.resolve(AsyncMaybe.fromNullable(x + 10)),
      );
      expect(await m.value()).toBe(30);
    });
  });

  describe("filterMap", () => {
    it("maps and filters values from an array", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve([1, 2, 3, 4, 5])).filterMap((x) =>
        x % 2 === 0 ? Maybe.fromNullable(x * 10) : Maybe.fromNullable(null),
      );
      expect(await m.value()).toEqual([20, 40]);
    });

    it("handles AsyncMaybe results inside filterMap", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve([1, 2, 3, 4, 5])).filterMap((x) =>
        x % 2 === 0
          ? AsyncMaybe.fromNullable(x * 10)
          : AsyncMaybe.fromNullable<number | null>(null),
      );
      expect(await m.value()).toEqual([20, 40]);
    });

    it("short circuits if Nothing", async () => {
      // @ts-expect-error
      const m = AsyncMaybe.fromPromise<number[] | null>(Promise.resolve(null)).filterMap((x) =>
        Maybe.fromNullable(x * 10),
      );
      expect(await m.value()).toBeNull();

      // @ts-expect-error
      const m2 = AsyncMaybe.fromPromise<number[] | undefined>(Promise.resolve(undefined)).filterMap(
        (x) => Maybe.fromNullable(x * 10),
      );
      expect(await m2.value()).toBeUndefined();
    });

    it("returns null if the value is not an array", async () => {
      // @ts-expect-error
      const m = AsyncMaybe.fromPromise(Promise.resolve(123)).filterMap((x) =>
        Maybe.fromNullable(x),
      );
      expect(await m.value()).toBeNull();
    });
  });

  describe("extend", () => {
    it("adds a computed property to an object when present", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve({ num: 3 })).extend("greet", (o) =>
        AsyncMaybe.fromNullable(`Hello ${o.num}`),
      );
      expect(await m.value()).toEqual({ num: 3, greet: "Hello 3" });
    });

    it("short circuits if the value is not an object", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(5)).extend("greet", (o) =>
        // @ts-expect-error
        AsyncMaybe.fromNullable(`Hello ${o.num}`),
      );
      expect(await m.value()).toBeNull();
    });

    it("does not confuse null for an object", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve(null)).extend("greet", (o) =>
        // @ts-expect-error
        AsyncMaybe.fromNullable(`Hello ${o.num}`),
      );
      expect(await m.value()).toBeNull();
    });

    it("supports chaining", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve({ a: 1 }))
        .extend("b", (o) => AsyncMaybe.fromNullable(o.a + 1))
        .extend("c", (o) => Maybe.fromNullable(o.b + 1));
      expect(await m.value()).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("short circuits if the function returns Nothing", async () => {
      const m = AsyncMaybe.fromPromise(Promise.resolve({ num: 2 }))
        .extend("greet", (o) => AsyncMaybe.fromNullable<string>(null))
        .map((obj) => `${obj.greet} stranger!`);
      expect(await m.value()).toBeNull();
    });
  });

  describe("assign", () => {
    it("assigns a single property", async () => {
      const user = AsyncMaybe.fromNullable({ id: 1, name: "Alice" });

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
      });

      expect(await result.value()).toEqual({
        id: 1,
        name: "Alice",
        profile: "ALICE",
      });
    });

    it("assigns multiple properties in parallel", async () => {
      const user = AsyncMaybe.fromNullable({ id: 2, name: "Bob" });

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
        settings: () => AsyncMaybe.fromNullable("dark"),
      });

      expect(await result.value()).toEqual({
        id: 2,
        name: "Bob",
        profile: "BOB",
        settings: "dark",
      });
    });

    it("short-circuits to Nothing if the AsyncMaybe is Nothing", async () => {
      const user = AsyncMaybe.fromNullable<{ id: number; name: string }>(null);

      const result = user.assign({
        profile: (u) => Maybe.fromNullable(u.name.toUpperCase()),
      });

      expect(await result.value()).toBeNull();
    });

    it("short-circuits to Nothing if the inner value is not an object", async () => {
      const notObj = AsyncMaybe.fromNullable(42);

      const result = notObj.assign({
        profile: () => Maybe.fromNullable("oops"),
      });

      expect(await result.value()).toBeNull();
    });

    it("short-circuits to Nothing if any property function returns Nothing", async () => {
      const user = AsyncMaybe.fromNullable({ id: 3, name: "Charlie" });

      const result = user.assign({
        profile: () => Maybe.fromNullable(null), // Nothing
        settings: () => AsyncMaybe.fromNullable("light"),
      });

      expect(await result.value()).toBeNull();
    });

    it("runs all property functions concurrently", async () => {
      const user = AsyncMaybe.fromNullable({ id: 4 });

      let ranFirst = false;
      let ranSecond = false;

      const result = user.assign({
        first: async () => {
          await new Promise((r) => setTimeout(r, 50));
          ranFirst = true;
          return Maybe.fromNullable("one" as const);
        },
        second: async () => {
          ranSecond = true;
          return AsyncMaybe.fromNullable("two");
        },
      });

      const value = await result.value();

      expect(ranFirst && ranSecond).toBeTrue();
      expect(value).toEqual({ id: 4, first: "one", second: "two" });
    });

    it("allows chaining with map after assign", async () => {
      const user = AsyncMaybe.fromNullable({ id: 5, name: "Diana" });

      const result = user
        .assign({
          profile: (u) => Maybe.fromNullable(u.name?.toUpperCase()),
        })
        .map((u) => u.profile + "!");

      expect(await result.value()).toBe("DIANA!");
    });
  });

  describe("withDefault / getOrElse", () => {
    it("withDefault supplies a value if Nothing", async () => {
      const absent = AsyncMaybe.fromPromise<number | null>(Promise.resolve(null)).withDefault(42);
      expect(await absent.value()).toBe(42);
    });

    it("withDefault does nothing if Just", async () => {
      const present = AsyncMaybe.fromPromise(Promise.resolve(10)).withDefault(42);
      expect(await present.value()).toBe(10);
    });

    it("getOrElse supplies a value if Nothing", async () => {
      const absent = AsyncMaybe.fromPromise<number | null>(Promise.resolve(null));
      expect(await absent.getOrElse(99)).toBe(99);
    });

    it("getOrElse unwraps the value if Just", async () => {
      const present = AsyncMaybe.fromPromise(Promise.resolve(88));
      expect(await present.getOrElse(0)).toBe(88);
    });
  });

  describe("filter", () => {
    it("narrows value with a type guard", async () => {
      const isNumber = (v: unknown): v is number => typeof v === "number";

      const num = AsyncMaybe.fromNullable(7).filter(isNumber);
      expect(await num.value()).toBe(7);

      const notNum = AsyncMaybe.fromNullable("str").filter(isNumber);
      expect(await notNum.value()).toBeNull();
    });

    it("keeps value if predicate passes", async () => {
      const gt3 = (n: number) => n > 3;

      const kept = AsyncMaybe.fromNullable(5).filter(gt3);
      expect(await kept.value()).toBe(5);

      const dropped = AsyncMaybe.fromNullable(2).filter(gt3);
      expect(await dropped.value()).toBeNull();
    });
  });

  describe("effect", () => {
    it("runs a side-effect if Just", async () => {
      const fn = mock(() => {});
      const m = AsyncMaybe.fromPromise(Promise.resolve(11)).effect(fn);
      await m.value();
      expect(fn).toHaveBeenCalledWith(11);
    });

    it("does not run the side-effect if Nothing", async () => {
      const fn = mock(() => {});
      const m = AsyncMaybe.fromPromise<number | null>(Promise.resolve(null)).effect(fn);
      await m.value();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("value", () => {
    it("returns the underlying Promise value", async () => {
      const promise = Promise.resolve(456);
      const m = AsyncMaybe.fromPromise(promise);
      expect(await m.value()).toBe(456);
    });
  });
});
