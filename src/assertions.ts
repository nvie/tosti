import type { Decoder } from "decoders";
import { constant, date, formatInline, isDecoder, poja, tuple } from "decoders";

import { fail } from "./TostiError";

type Expecter = Decoder<unknown>;

function makeArrayExpecter(expectedValue: unknown[]): Expecter {
  return poja
    .reject((arr) =>
      arr.length > expectedValue.length
        ? `Too many elements, expected ${expectedValue.length}, got ${arr.length}`
        : arr.length < expectedValue.length
          ? `Too few elements, expected ${expectedValue.length}, got ${arr.length}`
          : null,
    )
    .pipe(
      tuple(
        // @ts-expect-error deliberate
        ...expectedValue.map((v) => makeExpecter(v)),
      ),
    );
}

function makeDateExpecter(expectedValue: Date): Expecter {
  return date.reject((d) =>
    d.getTime() === expectedValue.getTime()
      ? null
      : `Must be new Date('${expectedValue.toISOString()}')`,
  );
}

function makeExpecter(expectedValue: unknown): Expecter {
  if (isDecoder(expectedValue)) return expectedValue;

  // Arrays are handled specially
  if (Array.isArray(expectedValue)) {
    return makeArrayExpecter(expectedValue);
  }

  // Objects, including class instances, are handled specially
  if (expectedValue !== null && typeof expectedValue === "object") {
    if (expectedValue instanceof Date) {
      return makeDateExpecter(expectedValue);
    }
    throw new Error("Deep object equality not implemented yet");
  }

  // Everything else is treated as a literal value
  return literally(expectedValue);
}

/**
 * Asserts that two values are deeply equal.
 */
export function assertEq(actual: unknown, expected: unknown): void {
  const result = makeExpecter(expected).decode(actual);
  if (result.ok) return;
  fail(formatInline(result.error), assertEq);
}

/**
 * Asserts that two values are referentially the same thing (using Object.is).
 */
export function assertSame(actual: unknown, expected: unknown): void {
  const result = literally(expected).decode(actual);
  if (result.ok) return;
  fail(formatInline(result.error), assertSame);

  // if (isSameValue(actual, expected)) return;
  // fail(`Expected ${String(expected)}, but got ${String(actual)}`, assertSame);
}

/**
 * Wrapper to treat the passed in schema or regex as a literal value.
 */
export function literally(expected: unknown): Expecter {
  // @ts-expect-error Normally constant() is used only with scalar values
  // In this case, however, it's fine to just use it for any literal value
  return constant(expected);
}
