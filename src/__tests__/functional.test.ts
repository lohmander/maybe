import { describe, test, expect } from "bun:test";
import {
  from,
  fromAsync,
  map,
  flatMap,
  filterMap,
  extend,
} from "../functional";
import { Maybe } from "../Maybe";
import { AsyncMaybe } from "../AsyncMaybe";

describe("functional", () => {
  describe("from", () => {
    test("wraps a value in a Maybe instance", () => {
      const maybe = from(42);
      expect(maybe).toBeInstanceOf(Maybe);
    });
  });

  describe("of", () => {
    test("wraps a Just value in a Maybe instance", () => {
      const maybe = from(42);
      expect(maybe).toBeInstanceOf(Maybe);
      expect(maybe.value()).toBe(42);
    });
  });

  describe("map", () => {
    test("applies the map function to the Just value", () => {
      const maybe = from(5);
      const mapped = map((x: number) => x * 2)(maybe);
      expect(mapped.value()).toBe(10);
    });

    test("returns Nothing when mapping over Nothing", () => {
      const maybe = from<number>(null);
      const mapped = map((x: number) => x * 2)(maybe);
      expect(mapped.value()).toBeNull();
    });

    test("maps over an AsyncMaybe", () => {
      const maybe = fromAsync(Promise.resolve(5));
      const mapped = map((x: number) => x * 2)(maybe);
      expect(mapped.value()).resolves.toEqual(10);
    });
  });

  describe("flatMap", () => {
    test("composes monadic functions", () => {
      const maybe = from(5);
      const flatMapped = flatMap((x: number) => from(x * 3))(maybe);
      expect(flatMapped.value()).toBe(15);
    });

    test("returns Nothing when flatMapping over Nothing", () => {
      const maybe = from<number>(undefined);
      const flatMapped = flatMap((x: number) => from(x * 3))(maybe);
      expect(flatMapped.value()).toBeUndefined();
    });

    test("flatMaps over an AsyncMaybe", () => {
      const maybe = fromAsync(Promise.resolve(5));
      const flatMapped = flatMap((x: number) =>
        fromAsync(Promise.resolve(x * 3)),
      )(maybe);
      expect(flatMapped.value()).resolves.toEqual(15);
    });

    test("flatMaps over an AsyncMaybe where the return of the map fn is a Maybe instance and yields an AsyncMaybe", () => {
      const maybe = fromAsync(Promise.resolve(5));
      const flatMapped = flatMap((x: number) => from(x * 3))(maybe);
      expect(flatMapped.value()).resolves.toEqual(15);
    });

    test("lifts a Maybe to AsyncMaybe", () => {
      const maybe = from(5);
      const flatMapped = flatMap((x: number) =>
        fromAsync(Promise.resolve(x * 3)),
      )(maybe);
      expect(flatMapped).toBeInstanceOf(AsyncMaybe);
    });
  });

  describe("filterMap", () => {
    test("maps and filters an array of values", () => {
      const maybe = from([1, 2, 3, 4, 5]);
      const filterMapped = filterMap((x: number) =>
        from(x % 2 === 0 ? x * 10 : null),
      )(maybe);
      expect(filterMapped.value()).toEqual([20, 40]);
    });

    test("returns Nothing when filtering over Nothing", () => {
      const maybe = from<number[]>(null);
      const filterMapped = filterMap((x: number) =>
        from(x % 2 === 0 ? x * 10 : null),
      )(maybe);
      expect(filterMapped.value()).toBeNull();
    });

    test("filterMaps over an AsyncMaybe", () => {
      const maybe = fromAsync(Promise.resolve([1, 2, 3, 4, 5]));
      const filterMapped = filterMap((x: number) =>
        fromAsync(Promise.resolve(x % 2 === 0 ? x * 10 : null)),
      )(maybe);
      expect(filterMapped.value()).resolves.toEqual([20, 40]);
    });

    test("filterMaps over an AsyncMaybe where the map fn returns a Maybe instance", () => {
      const maybe = fromAsync(Promise.resolve([1, 2, 3, 4, 5]));
      const filterMapped = filterMap((x: number) =>
        from(x % 2 === 0 ? x * 10 : null),
      )(maybe);
      expect(filterMapped.value()).resolves.toEqual([20, 40]);
    });

    test("returns undefined if the value is not an Array", () => {
      const maybe = fromAsync(Promise.resolve(42));
      // @ts-expect-error
      const filterMapped = filterMap((x: number) => from(x * 10))(maybe);
      // @ts-expect-error
      expect(filterMapped.value()).resolves.toBeUndefined();
    });

    test("fails if the map fn over a Maybe returns an AsyncMaybe", () => {
      const maybe = from([1, 2, 3, 4, 5]);
      expect(() =>
        filterMap((x: number) =>
          fromAsync(Promise.resolve(x % 2 === 0 ? x * 10 : null)),
        )(
          // @ts-expect-error
          maybe,
        ),
      ).toThrow();
    });
  });

  describe("extend", () => {
    test("chains dependent computations on object properties", () => {
      const maybe = from({ num: 3 });
      const extended = extend("greet", (o: { num: number }) =>
        from(`Hello ${o.num}`),
      )(maybe);
      expect(extended.value()).toEqual({ num: 3, greet: "Hello 3" });
    });

    test("short circuits if the Just value is not an object", () => {
      const maybe = from(5);
      const extended = extend("greet", (o) => from(`Hello ${o}`))(
        // @ts-expect-error
        maybe,
      );

      expect(extended.value()).toBeUndefined();
    });

    test("short circuits if the function returns Nothing", () => {
      const maybe = from({ num: 2 });
      const extended = extend("greet", (o: { num: number }) =>
        from<string>(undefined),
      )(maybe);
      expect(extended.value()).toBeUndefined();
    });

    test("works with AsyncMaybe", () => {
      const maybe = fromAsync(Promise.resolve({ num: 3 }));
      const extended = extend("greet", (o: { num: number }) =>
        fromAsync(Promise.resolve(`Hello ${o.num}`)),
      )(maybe);
      expect(extended.value()).resolves.toEqual({ num: 3, greet: "Hello 3" });
    });

    test("works with AsyncMaybe where the map fn returns a Maybe instance", () => {
      const maybe = fromAsync(Promise.resolve({ num: 3 }));
      const extended = extend("greet", (o: { num: number }) =>
        from(`Hello ${o.num}`),
      )(maybe);
      expect(extended.value()).resolves.toEqual({ num: 3, greet: "Hello 3" });
    });

    test("lifts Maybe to AsyncMaybe when the map fn of a Maybe returns an AsyncMaybe", () => {
      const maybe = from({ num: 3 });
      const extended = extend("greet", (o: { num: number }) =>
        fromAsync(Promise.resolve(`Hello ${o.num}`)),
      )(maybe);
      expect(extended).toBeInstanceOf(AsyncMaybe);
      expect(extended.value()).resolves.toEqual({ num: 3, greet: "Hello 3" });
    });
  });
});
