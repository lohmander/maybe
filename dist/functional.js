/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncMaybe } from "./AsyncMaybe";
import { Maybe } from "./Maybe";
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
export function map(fn) {
    return ((m) => m.map(fn));
}
export function flatMap(fn) {
    return ((m) => m.flatMap(fn));
}
export function filter(predicate) {
    return ((m) => m.filter(predicate));
}
export function filterMap(fn) {
    return ((m) => m.filterMap(fn));
}
export function extend(key, fn) {
    return ((m) => m.extend(key, fn));
}
export function assign(fns) {
    return ((m) => m.assign(fns));
}
/* withDefault */
export function withDefault(defaultValue) {
    return ((m) => m.withDefault(defaultValue));
}
/* getOrElse */
export function getOrElse(defaultValue) {
    return ((m) => m.getOrElse(defaultValue));
}
/* effect */
export function effect(fn) {
    return ((m) => m.effect(fn));
}
//# sourceMappingURL=functional.js.map