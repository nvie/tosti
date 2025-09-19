export function mapValues<V, O extends Record<PropertyKey, unknown>>(
  obj: O,
  mapFn: (value: O[keyof O], key: keyof O) => V,
): Record<keyof O, V> {
  const result = {} as Record<keyof O, V>;
  for (const k of Object.getOwnPropertyNames(obj)) {
    const key = k as keyof O;
    const value = mapFn(obj[key], key);
    // All keys are safe to set using regular bracket notation, except __proto__
    if (key === "__proto__") {
      Object.defineProperty(result, "__proto__", {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      result[key] = value;
    }
  }
  return result;
}
