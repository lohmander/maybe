import type { AsyncMaybe } from "./AsyncMaybe";
import type { Maybe } from "./Maybe";

export type ReturnMaybeType<T> = T extends (value: any) => Maybe<infer U>
  ? U
  : T extends (value: any) => AsyncMaybe<infer V>
    ? V
    : never;
