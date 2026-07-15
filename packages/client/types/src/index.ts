export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

export type UserId = string & { readonly __brand: 'UserId' };

export function toUserId(id: string): UserId {
  return id as UserId;
}
