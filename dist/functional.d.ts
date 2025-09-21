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
export declare const fromNullable: typeof Maybe.fromNullable;
export declare const fromPromise: typeof AsyncMaybe.fromPromise;
export declare const fromMaybe: typeof AsyncMaybe.fromMaybe;
export declare function map<A, B>(fn: (value: A) => B): {
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
    (m: Maybe<A>): Maybe<B>;
};
export declare function flatMap<A, B>(fn: (a: A) => Maybe<B>): {
    (m: Maybe<A>): Maybe<B>;
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export declare function flatMap<A, B>(fn: (a: A) => AsyncMaybe<B>): {
    (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<B>;
};
export declare function filter<A, B extends A>(predicate: (value: A) => value is B): {
    (m: Maybe<A>): Maybe<B>;
    (m: AsyncMaybe<A>): AsyncMaybe<B>;
};
export declare function filter<A>(predicate: (value: A) => boolean): {
    (m: Maybe<A>): Maybe<A>;
    (m: AsyncMaybe<A>): AsyncMaybe<A>;
};
export declare function filterMap<A, B>(fn: (value: A) => Maybe<B>): {
    <M extends Maybe<A[]> | AsyncMaybe<A[]>>(m: M): M extends AsyncMaybe<A[]> ? AsyncMaybe<B[]> : Maybe<B[]>;
};
export declare function filterMap<A, B>(fn: (value: A) => AsyncMaybe<B>): {
    (m: Maybe<A[]>): AsyncMaybe<B[]>;
    (m: AsyncMaybe<A[]>): AsyncMaybe<B[]>;
};
export declare function extend<A extends object, K extends string, B>(key: K, fn: (value: A) => Maybe<B>): {
    (m: Maybe<A>): Maybe<A & {
        [P in K]: B;
    }>;
    (m: AsyncMaybe<A>): AsyncMaybe<A & {
        [P in K]: B;
    }>;
};
export declare function extend<A extends object, K extends string, B>(key: K, fn: (value: A) => AsyncMaybe<B>): {
    (m: Maybe<A> | AsyncMaybe<A>): AsyncMaybe<A & {
        [P in K]: B;
    }>;
};
export declare function assign<A extends object, Exts extends Record<string, (value: A) => Maybe<any>>>(fns: Exts): (m: Maybe<A>) => Maybe<A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
}>;
export declare function assign<A extends object, Exts extends Record<string, (value: A) => Maybe<any> | AsyncMaybe<any> | Promise<Maybe<any> | AsyncMaybe<any>>>>(fns: Exts): (m: Maybe<A> | AsyncMaybe<A>) => AsyncMaybe<A & {
    [P in keyof Exts]: ReturnMaybeType<Exts[P]>;
}>;
export declare function withDefault<B>(defaultValue: B): {
    <M extends Maybe<any> | AsyncMaybe<any>>(m: M): M extends Maybe<infer A> ? Maybe<A | B> : M extends AsyncMaybe<infer A> ? AsyncMaybe<A | B> : never;
};
export declare function getOrElse<A, B>(defaultValue: B): {
    (m: Maybe<A>): A | B;
    (m: AsyncMaybe<A>): Promise<A | B>;
};
export declare function effect<A>(fn: (value: A) => void | Promise<void>): {
    (m: Maybe<A>): Maybe<A>;
    (m: AsyncMaybe<A>): AsyncMaybe<A>;
};
//# sourceMappingURL=functional.d.ts.map