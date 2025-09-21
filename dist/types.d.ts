import type { AsyncMaybe } from "./AsyncMaybe";
import type { Maybe } from "./Maybe";
export type ExtractValue<M> = M extends Maybe<infer T> ? T : M extends AsyncMaybe<infer T> ? T : M extends Promise<infer T> ? ExtractValue<T> : never;
export type ReturnMaybeType<Fn extends (...args: any[]) => any> = ExtractValue<ReturnType<Fn>>;
//# sourceMappingURL=types.d.ts.map