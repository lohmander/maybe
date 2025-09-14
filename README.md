# maybe

A small, pragmatic TypeScript Maybe/AsyncMaybe helper focused on real-world JavaScript ergonomics — not a purist FP framework.

This project aims to be:
- Practical: simple, predictable semantics for everyday code.
- JavaScript-first: behave like JS developers expect (null/undefined are the only "nothing" values; falsy but valid values like `0`, `''`, `false` are preserved).
- Seamless between sync & async: the async variant (`AsyncMaybe`) mirrors `Maybe` and flattens sensible return types so you can switch between sync and async flows with minimal friction.
- Type-friendly: useful TypeScript overloads and helper types to keep inference ergonomic.

Core ideas (short)
- Maybe holds either a present value or `null|undefined` (the canonical Nothing).
- AsyncMaybe wraps a `Promise<T | null | undefined>` and mirrors Maybe's API.
- `flatMap` / `map` / `filter` are chainable and short-circuit on Nothing.
- Async mappers may return a `Maybe`, `AsyncMaybe`, a raw value, or a `Promise` of any of those — the implementation normalizes and unwraps one level to avoid nested containers.

Why this approach
- Many FP libraries carry a lot of academic surface area and strict laws. This library intentionally trades purism for ergonomics:
  - Explicit `fromNullable` conversion makes null handling deliberate.
  - No automatic flattening of arbitrary monads — only `Maybe` and `AsyncMaybe` are recognized.
  - APIs are small and predictable, making them easy to adopt and compose with existing JS code.

When to use it
- To avoid scattering `null`/`undefined` checks across code paths.
- For composable value pipelines that may involve asynchronous calls.
- When you want a light-weight, readable option type without heavyweight FP constraints.

Quick examples (conceptual)
- Synchronous:
  - Create: `Maybe.fromNullable(value)`
  - Transform: `.map(fn)` / `.flatMap(fn)`
  - Unwrap: `.getOrElse(default)`

- Asynchronous:
  - Create from promise: `AsyncMaybe.fromPromise(promise)`
  - Lift sync maybe: `AsyncMaybe.fromMaybe(maybe)`
  - Compose async flows: `.flatMap(asyncMapper)` — returns `AsyncMaybe` and unwraps nested results.

Notes & recommendations
- Prefer `withDefault` / `getOrElse` at the edges where you need raw values.
- Use `filter` with type guards to narrow types safely.
- `assign` / `extend` helpers are provided for common object-building patterns inside containers.
- Add `of` or other Fantasy-Land compatibility shims only if you need them; they are intentionally omitted to keep the surface minimal.

Contributing
- Contributions welcome. Open an issue or PR for bugs, features, or improvements.
- Tests and documentation updates appreciated.
