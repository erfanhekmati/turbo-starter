/** JSON-serializable values for API boundaries and caching. */
export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/** Example shared identifier branded type (use in API + web contracts). */
export type UserId = string & { readonly __brand: 'UserId' };

export function toUserId(id: string): UserId {
  return id as UserId;
}
