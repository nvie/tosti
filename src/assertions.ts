import { formatInline, isPromiseLike } from "decoders";

import { literally, makeExpector } from "./expectors";
import { fail } from "./TostiError";

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
  const result = makeExpector(expected).decode(actual);
  if (result.ok) return;
  fail(formatInline(result.error), assertEq);
}

async function assertEq_async(
  actual$: PromiseLike<unknown>,
  expected: unknown,
): Promise<void> {
  const result = makeExpector(expected).decode(await actual$);
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
