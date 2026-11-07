/** Expected failures are values, not exceptions: callers must handle `ok: false`. */
export type Result<T, E extends string> = { ok: true; data: T } | { ok: false; error: E };

export const ok = <T>(data: T) => ({ ok: true, data }) as const;
export const err = <E extends string>(error: E) => ({ ok: false, error }) as const;
