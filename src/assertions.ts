import type { Decoder } from "decoders";
import {
  constant,
  date,
  exact,
  formatInline,
  isDecoder,
  isPromiseLike,
  poja,
  pojo,
  regex,
  tuple,
  unknown,
} from "decoders";

import { isPojo } from "./decoders";
import { fail } from "./TostiError";
import { mapValues } from "./utils";

type Expecter = Decoder<unknown>;

function makeArrayExpecter(expected: unknown[]): Expecter {
  return poja
    .reject((arr) =>
      arr.length > expected.length
        ? `Too many elements, expected ${expected.length}, got ${arr.length}`
        : arr.length < expected.length
          ? `Too few elements, expected ${expected.length}, got ${arr.length}`
          : null,
    )
    .pipe(
      tuple(
        // @ts-expect-error deliberate
        ...expected.map((v) => makeExpecter(v)),
      ),
    );
}

function makeDateExpecter(expected: Date): Expecter {
  return date.reject((d) =>
    d.getTime() === expected.getTime()
      ? null
      : `Must be new Date('${expected.toISOString()}')`,
  );
}

function makeObjectExpecter(expected: Record<PropertyKey, unknown>): Expecter {
  return pojo.pipe(exact(mapValues(expected, makeExpecter)));
}

function makeRegexExpecter(expectedValue: RegExp): Expecter {
  return regex(expectedValue, `Must match ${expectedValue.toString()}`);
}

const nanExpecter: Expecter = unknown.refine(
  (x) => Number.isNaN(x as number),
  "Must be NaN",
);

function makeExpecter(expectedValue: unknown): Expecter {
  if (isDecoder(expectedValue)) return expectedValue;

  // NaN is handled specially
  if (Number.isNaN(expectedValue as number)) {
    return nanExpecter;
  }

  // Arrays are handled specially
  if (Array.isArray(expectedValue)) {
    return makeArrayExpecter(expectedValue);
  }

  // RegExps
  if (expectedValue instanceof RegExp) {
    return makeRegexExpecter(expectedValue);
  }

  // Dates
  if (expectedValue instanceof Date) {
    return makeDateExpecter(expectedValue);
  }

  // Plain old JavaScript objects
  if (isPojo(expectedValue)) {
    return makeObjectExpecter(expectedValue);
  }

  // Everything else is treated as a literal value
  return literally(expectedValue);
}

/**
 * Asserts that two values are deeply equal.
 */
export async function assertEq(actual: PromiseLike<unknown>, expected: unknown): Promise<void>; // prettier-ignore
/**
 * Asserts that two values are deeply equal.
 */
export function assertEq(actual: unknown, expected: unknown): void;
export function assertEq(
  actual: unknown,
  expected: unknown,
): void | Promise<void> {
  return isPromiseLike(actual)
    ? assertEq_async(actual, expected)
    : // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      assertEq_sync(actual, expected);
}

function assertEq_sync(actual: unknown, expected: unknown): void {
  const result = makeExpecter(expected).decode(actual);
  if (result.ok) return;
  fail(formatInline(result.error), assertEq);
}

async function assertEq_async(
  actual$: PromiseLike<unknown>,
  expected: unknown,
): Promise<void> {
  const result = makeExpecter(expected).decode(await actual$);
  if (result.ok) return;
  fail(formatInline(result.error), assertEq);
}

/**
 * Asserts that two values are referentially the same thing (using Object.is).
 */
export async function assertSame(actual: PromiseLike<unknown>, expected: unknown): Promise<void>; // prettier-ignore
/**
 * Asserts that two values are referentially the same thing (using Object.is).
 */
export function assertSame(actual: unknown, expected: unknown): void;
export function assertSame(
  actual: unknown,
  expected: unknown,
): void | Promise<void> {
  return isPromiseLike(actual)
    ? assertSame_async(actual, expected)
    : // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      assertSame_sync(actual, expected);
}

export function assertSame_sync(actual: unknown, expected: unknown): void {
  const result = literally(expected).decode(actual);
  if (result.ok) return;
  fail(formatInline(result.error), assertSame);
}

export async function assertSame_async(
  actual$: PromiseLike<unknown>,
  expected: unknown,
): Promise<void> {
  const result = literally(expected).decode(await actual$);
  if (result.ok) return;
  fail(formatInline(result.error), assertSame);
}

/**
 * Wrapper to treat the passed in schema or regex as a literal value.
 */
export function literally(expected: unknown): Expecter {
  // NaN is a weird one, because Object.is(NaN, NaN) is true
  if (Number.isNaN(expected)) return nanExpecter;

  // @ts-expect-error Normally constant() is used only with scalar values
  // In this case, however, it's fine to just use it for any literal value
  return constant(expected);
}
