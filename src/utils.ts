export function isNothing<T>(value?: T | null): value is null | undefined {
  return value == null;
}

export function isJust<T>(value?: T | null): value is T {
  return !isNothing(value);
}
