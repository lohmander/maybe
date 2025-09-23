/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AsyncMaybe } from "./AsyncMaybe";
import type { Maybe } from "./Maybe";

export type ExtractValue<M> =
  M extends Maybe<infer T>
    ? T
    : M extends AsyncMaybe<infer T>
      ? T
      : M extends Promise<infer T>
        ? ExtractValue<T>
        : never;

export type ReturnMaybeType<Fn extends (...args: any[]) => any> = ExtractValue<ReturnType<Fn>>;

export type AnyMaybe<T> = Maybe<T> | AsyncMaybe<T>;
export type ExtractMaybeArrayValue<M extends ReadonlyArray<Maybe<any> | AsyncMaybe<any>>> =
  M[number] extends AnyMaybe<infer T> ? T : never;
