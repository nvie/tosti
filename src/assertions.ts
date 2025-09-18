import type { Decoder } from "decoders";
import { constant, date, formatInline, isDecoder } from "decoders";

// import type { Relax } from "./lib/Relax";
import { fail } from "./TostiError";

// type TypecheckResult = Relax<
//   | { isMatch: true }
//   | { isMatch: false; expectedType: string; actualType: string }
// >;

function isSameValue(x: unknown, y: unknown) {
  return Object.is(x, y);
}

// function humanFriendlyTypeDescription(value: unknown): string {
//   if (value === null) return "null";
//   if (Array.isArray(value)) return "an array";
//   if (value instanceof Date) return "a Date";
//   if (value instanceof RegExp) return "a RegExp";
//   if (value instanceof Map) return "a Map";
//   if (value instanceof Set) return "a Set";
//
//   const t = typeof value;
//   if (t === "object") return "an object";
//   if (t === "undefined") return "undefined";
//   return `a ${t}`;
// }

// function checkType(actual: unknown, expected: unknown): TypecheckResult {
//   if (isSameValue(actual, expected)) return { isMatch: true };
//
//   return {
//     isMatch: false,
//     expectedType: humanFriendlyTypeDescription(expected),
//     actualType: humanFriendlyTypeDescription(actual),
//   };
// }

function makeDecoder(expectedValue: unknown): Decoder<unknown> {
  if (isDecoder(expectedValue)) return expectedValue;

  if (Array.isArray(expectedValue)) {
    throw new Error("Deep array equality not implemented yet");
  } else if (expectedValue !== null && typeof expectedValue === "object") {
    if (expectedValue instanceof Date) {
      return date.reject((d) =>
        d.getTime() === expectedValue.getTime()
          ? null
          : `Must be new Date('${expectedValue.toISOString()}')`,
      );
    }
    throw new Error("Deep object equality not implemented yet");
  } else {
    return literally(expectedValue);
  }
}

// TODO Maybe export this directly from decoders instead?
type Annotation = Parameters<typeof formatInline>[0];

function formatAsTostiError(err: Annotation): string {
  return formatInline(err);
}

/**
 * Asserts that two values are deeply equal.
 */
export function assertEq(actual: unknown, expected: unknown): void {
  const result = makeDecoder(expected).decode(actual);
  if (result.ok) return;
  fail(formatAsTostiError(result.error), assertEq);
}

/**
 * Asserts that two values are referentially the same thing (using ===).
 */
export function assertSame<T>(actual: T, expected: T): void {
  const result = literally(expected).decode(actual);
  if (result.ok) return;
  fail(formatAsTostiError(result.error), assertSame);

  // if (isSameValue(actual, expected)) return;
  // fail(`Expected ${String(expected)}, but got ${String(actual)}`, assertSame);
}

/**
 * Wrapper to treat the passed in schema or regex as a literal value.
 */
export function literally(value: unknown): Decoder<unknown> {
  // @ts-expect-error Normally constant() is used only with scalar values
  // In this case, however, it's fine to just use it for any literal value
  return constant(value);
}
