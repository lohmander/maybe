import { describe, test, expect } from "bun:test";
import {
  fromNullable,
  fromPromise,
  map,
  flatMap,
  filterMap,
  extend,
  assign,
} from "../functional";
import { Maybe } from "../Maybe";
import { AsyncMaybe } from "../AsyncMaybe";

describe("functional interface", () => {
  describe("fromNullable", () => {
    test("wraps a value in a Maybe instance", () => {
      const maybe = fromNullable(42);
      expect(maybe).toBeInstanceOf(Maybe);
      expect(maybe.value()).toBe(42);
    });

    test("wraps null in a Maybe as Nothing", () => {
      const maybe = fromNullable<number>(null);
      expect(maybe.value()).toBeNull();
    });
  });

  describe("fromPromise", () => {
    test("wraps a Promise value in an AsyncMaybe instance", async () => {
      const asyncMaybe = fromPromise(Promise.resolve(42));
      expect(asyncMaybe).toBeInstanceOf(AsyncMaybe);
      expect(await asyncMaybe.value()).toBe(42);
    });

    test("wraps Promise<null> as AsyncMaybe Nothing", async () => {
      const asyncMaybe = fromPromise<number | null>(Promise.resolve(null));
      expect(await asyncMaybe.value()).toBeNull();
    });
  });

  describe("map", () => {
    test("maps over a Maybe", () => {
      const maybe = fromNullable(5);
      const mapped = map((x: number) => x * 2)(maybe);
      expect(mapped.value()).toBe(10);
    });

    test("returns Nothing when mapping over Nothing (Maybe)", () => {
      const maybe = fromNullable<number>(null);
      const mapped = map((x: number) => x * 2)(maybe);
      expect(mapped.value()).toBeNull();
    });

    test("maps over an AsyncMaybe", async () => {
      const asyncMaybe = fromPromise(Promise.resolve(5));
      const mapped = map((x: number) => x * 2)(asyncMaybe);
      expect(await mapped.value()).toBe(10);
    });

    test("returns Nothing when mapping over Nothing (AsyncMaybe)", async () => {
      const asyncMaybe = fromPromise<number>(Promise.resolve(null));
      const mapped = map((x: number) => x * 2)(asyncMaybe);
      expect(await mapped.value()).toBeNull();
    });
  });

  describe("flatMap", () => {
    test("flatMaps over a Maybe", () => {
      const maybe = fromNullable(5);
      const flatMapped = flatMap((x: number) => fromNullable(x * 3))(maybe);
      expect(flatMapped.value()).toBe(15);
    });

    test("returns Nothing when flatMapping over Nothing (Maybe)", () => {
      const maybe = fromNullable<number>(null);
      const flatMapped = flatMap((x: number) => fromNullable(x * 3))(maybe);
      expect(flatMapped.value()).toBeNull();
    });

    test("flatMaps over an AsyncMaybe", async () => {
      const asyncMaybe = fromPromise(Promise.resolve(5));
      const flatMapped = flatMap((x: number) =>
        fromPromise(Promise.resolve(x * 3)),
      )(asyncMaybe);
      expect(await flatMapped.value()).toBe(15);
    });

    test("flatMaps AsyncMaybe with a Maybe-returning function", async () => {
      const asyncMaybe = fromPromise(Promise.resolve(5));
      const flatMapped = flatMap((x: number) => fromNullable(x * 3))(
        asyncMaybe,
      );
      expect(await flatMapped.value()).toBe(15);
    });

    test("lifts Maybe to AsyncMaybe when the fn returns AsyncMaybe", async () => {
      const maybe = fromNullable(5);
      const flatMapped = flatMap((x: number) =>
        fromPromise(Promise.resolve(x * 3)),
      )(maybe);
      expect(flatMapped).toBeInstanceOf(AsyncMaybe);
      expect(await flatMapped.value()).toBe(15);
    });
  });

  describe("filterMap", () => {
    test("maps and filters an array (Maybe)", () => {
      const maybe = fromNullable([1, 2, 3, 4, 5]);
      const filterMapped = filterMap((x: number) =>
        fromNullable(x % 2 === 0 ? x * 10 : null),
      )(maybe);
      expect(filterMapped.value()).toEqual([20, 40]);
    });

    test("returns Nothing when filtering over Nothing (Maybe)", () => {
      const maybe = fromNullable<number[]>(null);
      const filterMapped = filterMap((x: number) =>
        fromNullable(x % 2 === 0 ? x * 10 : null),
      )(maybe);
      expect(filterMapped.value()).toBeNull();
    });

    test("filterMaps over an AsyncMaybe", async () => {
      const asyncMaybe = fromPromise(Promise.resolve([1, 2, 3, 4, 5]));
      const filterMapped = filterMap((x: number) =>
        fromPromise(Promise.resolve(x % 2 === 0 ? x * 10 : null)),
      )(asyncMaybe);
      expect(await filterMapped.value()).toEqual([20, 40]);
    });

    test("filterMaps AsyncMaybe with Maybe-returning fn", async () => {
      const asyncMaybe = fromPromise(Promise.resolve([1, 2, 3, 4, 5]));
      const filterMapped = filterMap((x: number) =>
        fromNullable(x % 2 === 0 ? x * 10 : null),
      )(asyncMaybe);
      expect(await filterMapped.value()).toEqual([20, 40]);
    });

    test("returns Nothing if the map fn of a Maybe returns an AsyncMaybe", () => {
      const maybe = fromNullable([1, 2, 3, 4, 5]);
      const filterMapped = filterMap((x: number) =>
        fromPromise(Promise.resolve(x % 2 === 0 ? x * 10 : null)),
      )(maybe);
      expect(filterMapped.value()).toBeNull();
    });
  });

  describe("extend", () => {
    test("extends an object inside a Maybe", () => {
      const maybe = fromNullable({ num: 3 });
      const extended = extend("greet", (o: { num: number }) =>
        fromNullable(`Hello ${o.num}`),
      )(maybe);
      expect(extended.value()).toEqual({ num: 3, greet: "Hello 3" });
    });

    test("short circuits if the Just value is not an object (Maybe)", () => {
      const maybe = fromNullable(5);
      const extended = extend("greet", (o) => fromNullable(`Hello ${o}`))(
        // @ts-expect-error not an object
        maybe,
      );
      expect(extended.value()).toBeNull();
    });

    test("short circuits if the fn returns Nothing (Maybe)", () => {
      const maybe = fromNullable({ num: 2 });
      const extended = extend("greet", (_o: { num: number }) =>
        fromNullable<string>(null),
      )(maybe);
      expect(extended.value()).toBeNull();
    });

    test("extends an object inside an AsyncMaybe", async () => {
      const asyncMaybe = fromPromise(Promise.resolve({ num: 3 }));
      const extended = extend("greet", (o: { num: number }) =>
        fromPromise(Promise.resolve(`Hello ${o.num}`)),
      )(asyncMaybe);
      expect(await extended.value()).toEqual({ num: 3, greet: "Hello 3" });
    });

    test("works with AsyncMaybe where fn returns a Maybe", async () => {
      const asyncMaybe = fromPromise(Promise.resolve({ num: 3 }));
      const extended = extend("greet", (o: { num: number }) =>
        fromNullable(`Hello ${o.num}`),
      )(asyncMaybe);
      expect(await extended.value()).toEqual({ num: 3, greet: "Hello 3" });
    });

    test("lifts Maybe to AsyncMaybe when fn returns AsyncMaybe", async () => {
      const maybe = fromNullable({ num: 3 });
      const extended = extend("greet", (o: { num: number }) =>
        fromPromise(Promise.resolve(`Hello ${o.num}`)),
      )(maybe);
      expect(extended).toBeInstanceOf(AsyncMaybe);
      expect(await extended.value()).toEqual({ num: 3, greet: "Hello 3" });
    });
  });

  describe("assign", () => {
    test("assigns new properties with Maybe extenders", () => {
      const user = fromNullable({ id: 1, name: "Alice" });
      const assigned = assign({
        // @ts-expect-error
        profile: (u: { name: string }) => fromNullable(u.name),
      })(user);

      expect(assigned).toBeInstanceOf(Maybe);
      expect(assigned.value()).toEqual({
        id: 1,
        name: "Alice",
        profile: "Alice",
      });
    });

    test("short-circuits to Nothing if a property is Nothing", () => {
      const user = fromNullable({ id: 2, name: null });
      const assigned = assign({
        // @ts-expect-error
        profile: (u: { name: string | null }) => fromNullable(u.name),
      })(user);

      expect(assigned).toBeInstanceOf(Maybe);
      expect(assigned.value()).toBeNull();
    });

    test("assigns new properties with AsyncMaybe extenders", async () => {
      const user = fromNullable({ id: 3, name: "Bob" });
      const map = {
        profile: (u: { name: string }) =>
          fromPromise(Promise.resolve(`Hello ${u.name}`)),
      };
      // @ts-expect-error
      const assigned = assign(map)(user);

      expect(assigned).toBeInstanceOf(AsyncMaybe);

      expect(assigned.value()).resolves.toEqual({
        id: 3,
        name: "Bob",
        profile: "Hello Bob",
      });
    });

    test("short-circuits to Nothing if an async property is Nothing", async () => {
      const user = fromNullable({ id: 4, name: null });
      const assigned = assign({
        // @ts-expect-error
        profile: (u: { name: string | null }) =>
          fromPromise(Promise.resolve(null)),
      })(user);

      expect(assigned).toBeInstanceOf(AsyncMaybe);
      expect(assigned.value()).resolves.toBeNull();
    });

    test("mixes Maybe and AsyncMaybe extenders and promotes to AsyncMaybe", async () => {
      const user = fromNullable({ id: 5, name: "Charlie" });
      const assigned = assign({
        // @ts-expect-error
        profile: (u: { name: string }) => fromNullable(u.name),
        settings: () => fromPromise(Promise.resolve("dark")),
      })(user);

      expect(assigned).toBeInstanceOf(AsyncMaybe);
      expect(assigned.value()).resolves.toEqual({
        id: 5,
        name: "Charlie",
        profile: "Charlie",
        settings: "dark",
      });
    });

    test("short-circuits when input is Nothing", () => {
      const user = fromNullable<object>(null);
      const assigned = assign({
        profile: () => fromNullable("nope"),
      })(user);

      expect(assigned.value()).toBeNull();
    });
  });
});
