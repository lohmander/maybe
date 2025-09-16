/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncMaybe } from "./AsyncMaybe";
import { Maybe } from "./Maybe";
import type { ReturnMaybeType } from "./types";

/**
 * Lightweight functional wrappers for Maybe and AsyncMaybe.
 *
 * This file intentionally uses `any` in the implementation bodies to keep
 * overloads simple and to avoid TypeScript inference edge cases in the
 * wrapper layer. The public typings on the overloads remain accurate.
 *
 * The implementation simply forwards to the appropriate method on the
 * provided container (Maybe or AsyncMaybe) using casts to `any`.
 */

/* re-exports for convenience */
export const fromNullable = Maybe.fromNullable;
export const fromPromise = AsyncMaybe.fromPromise;
export const fromMaybe = AsyncMaybe.fromMaybe;

/* map */
export function map<A, B>(
  fn: (value: A) => B,
): {
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
  (m: Maybe<A>): Maybe<B>;
} {
  return ((m: any) => (m as any).map(fn as any)) as any;
}

/* flatMap */
export function flatMap<A, B>(
  fn: (a: A) => Maybe<B>,
): {
  (m: Maybe<A>): Maybe<B>;
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export function flatMap<A, B>(
  fn: (a: A) => AsyncMaybe<B>,
): {
  (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<B>;
};
export function flatMap<A, B>(
  fn: (a: A) => Maybe<B> | AsyncMaybe<B>,
): (m: any) => Maybe<B> | AsyncMaybe<B> {
  return ((m: any) => (m as any).flatMap(fn as any)) as any;
}

/* filter */
export function filter<A, B extends A>(
  predicate: (value: A) => value is B,
): {
  (m: Maybe<A>): Maybe<B>;
  (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export function filter<A>(predicate: (value: A) => boolean): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
};
export function filter<A>(predicate: (value: A) => boolean): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
} {
  return ((m: any) => (m as any).filter(predicate as any)) as any;
}

/* filterMap */
export function filterMap<A, B>(
  fn: (value: A) => Maybe<B>,
): {
  <M extends Maybe<A[]> | AsyncMaybe<A[]>>(
    m: M,
  ): M extends AsyncMaybe<A[]> ? AsyncMaybe<B[]> : Maybe<B[]>;
};
export function filterMap<A, B>(
  fn: (value: A) => AsyncMaybe<B>,
): {
  (m: Maybe<A[]>): AsyncMaybe<B[]>;
  (m: AsyncMaybe<A[]>): AsyncMaybe<B[]>;
};
export function filterMap<A, B>(
  fn: (value: A) => Maybe<B> | AsyncMaybe<B>,
): (m: any) => Maybe<B[]> | AsyncMaybe<B[]> {
  return ((m: any) => (m as any).filterMap(fn as any)) as any;
}

/* extend */
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => Maybe<B>,
): {
  (m: Maybe<A>): Maybe<A & { [P in K]: B }>;
  (m: AsyncMaybe<A>): AsyncMaybe<A & { [P in K]: B }>;
};
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => AsyncMaybe<B>,
): {
  (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<A & { [P in K]: B }>;
};
export function extend<A extends object, K extends string, B>(
  key: K,
  fn: (value: A) => Maybe<B> | AsyncMaybe<B>,
): {
  (m: Maybe<A> | AsyncMaybe<A>): any;
} {
  return ((m: any) => (m as any).extend(key, fn as any)) as any;
}

/* assign */
export function assign<A extends object, Exts extends Record<string, (value: A) => Maybe<any>>>(
  fns: Exts,
): (m: Maybe<A>) => Maybe<
  A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
  }
>;
export function assign<
  A extends object,
  Exts extends Record<
    string,
    (value: A) => Maybe<any> | AsyncMaybe<any> | Promise<Maybe<any> | AsyncMaybe<any>>
  >,
>(
  fns: Exts,
): (m: Maybe<A> | AsyncMaybe<A>) => AsyncMaybe<
  A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
  }
>;
export function assign<
  A extends object,
  Exts extends Record<string, (value: A) => Maybe<any> | AsyncMaybe<any>>,
>(fns: Exts): (m: any) => any {
  return ((m: any) => (m as any).assign(fns as any)) as any;
}

/* withDefault */
export function withDefault<B>(defaultValue: B): {
  <M extends Maybe<any> | AsyncMaybe<any>>(
    m: M,
  ): M extends Maybe<infer A>
    ? Maybe<A | B>
    : M extends AsyncMaybe<infer A>
      ? AsyncMaybe<A | B>
      : never;
} {
  return ((m: any) => (m as any).withDefault(defaultValue)) as any;
}

/* getOrElse */
export function getOrElse<A, B>(
  defaultValue: B,
): {
  (m: Maybe<A>): A | B;
  (m: AsyncMaybe<A>): Promise<A | B>;
} {
  return ((m: any) => (m as any).getOrElse(defaultValue)) as any;
}

/* effect */
export function effect<A>(fn: (value: A) => void | Promise<void>): {
  (m: Maybe<A>): Maybe<A>;
  (m: AsyncMaybe<A>): AsyncMaybe<A>;
} {
  return ((m: any) => (m as any).effect(fn as any)) as any;
}
