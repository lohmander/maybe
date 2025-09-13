import { AsyncMaybe } from "./AsyncMaybe";
import { Maybe } from "./Maybe";

export const from = Maybe.from;

export const fromAsync = AsyncMaybe.from;

export const of = Maybe.of;

export function map<Just, U>(fn: (value: Just) => U) {
  function mapper(maybe: Maybe<Just>): Maybe<U>;
  function mapper(maybe: AsyncMaybe<Just>): AsyncMaybe<U>;
  function mapper(
    maybe: Maybe<Just> | AsyncMaybe<Just>,
  ): Maybe<U> | AsyncMaybe<U> {
    return maybe.map(fn);
  }

  return mapper;
}

export function flatMap<
  Just,
  U,
  V extends
    | Maybe<U>
    | AsyncMaybe<U>
    | Promise<Maybe<U> | Promise<AsyncMaybe<U>>>,
>(fn: (value: Just) => V) {
  function mapper(
    maybe: Maybe<Just>,
  ): V extends Maybe<U> ? Maybe<U> : AsyncMaybe<U>;
  function mapper(maybe: AsyncMaybe<Just>): AsyncMaybe<U>;
  function mapper(
    maybe: Maybe<Just> | AsyncMaybe<Just>,
  ): Maybe<U> | AsyncMaybe<U> {
    if (maybe instanceof Maybe) {
      return maybe.flatMap(fn as (value: Just) => Maybe<U>);
    } else {
      return maybe.flatMap(fn as (value: Just) => AsyncMaybe<U>);
    }
  }

  return mapper;
}

export function filterMap<
  Just extends any[],
  U,
  MapReturn extends Maybe<U> | AsyncMaybe<U>,
>(fn: (value: Just[number]) => MapReturn) {
  function mapper(
    maybe: MapReturn extends Maybe<U> ? Maybe<U[]> : never,
  ): Maybe<U[]>;
  function mapper(maybe: AsyncMaybe<U[]>): AsyncMaybe<U[]>;
  function mapper(
    maybe: Maybe<U[]> | AsyncMaybe<U[]>,
  ): Maybe<U[]> | AsyncMaybe<U[]> {
    if (maybe instanceof Maybe) {
      return maybe.filterMap(fn as (value: Just[number]) => Maybe<U>);
    } else {
      return maybe.filterMap(fn as (value: Just[number]) => AsyncMaybe<U>);
    }
  }

  return mapper;
}

export function extend<
  Just extends object,
  K extends string,
  U,
  MapReturn extends Maybe<U> | AsyncMaybe<U>,
>(key: K, fn: (value: Just) => MapReturn) {
  function extender(
    maybe: Maybe<Just>,
  ): MapReturn extends Maybe<U>
    ? Maybe<Just & { [P in K]: U }>
    : AsyncMaybe<Just & { [P in K]: U }>;
  function extender(
    maybe: AsyncMaybe<Just>,
  ): MapReturn extends Maybe<U>
    ? Maybe<Just & { [P in K]: U }>
    : AsyncMaybe<Just & { [P in K]: U }>;
  function extender(
    maybe: Maybe<Just> | AsyncMaybe<Just>,
  ): Maybe<Just & { [P in K]: U }> | AsyncMaybe<Just & { [P in K]: U }> {
    if (maybe instanceof Maybe) {
      return maybe.extend(key, fn as (value: Just) => Maybe<U>);
    } else {
      return maybe.extend(key, fn as (value: Just) => AsyncMaybe<U>);
    }
  }

  return extender;
}
