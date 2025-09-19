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

/**
 * Asserts that a function throws an error that matches the expected message or pattern.
 */
export function assertThrows(
  thunk: () => unknown,
  expectedMessage: string | RegExp,
): void {
  let threw = false;
  let caughtError: unknown;
  try {
    thunk();
  } catch (error) {
    threw = true;
    caughtError = error;
  }

  if (threw) {
    assertThrows_sync_withThrow(caughtError, expectedMessage);
  } else {
    fail(
      `Expected function to throw an error, but it did not throw`,
      assertThrows,
    );
  }
}

function assertThrows_sync_withThrow(
  error: unknown,
  expected: string | RegExp,
): void {
  if (!(error instanceof Error)) {
    fail(
      `Expected function to throw an Error, but it threw: ${JSON.stringify(error)}`,
      assertThrows,
    );
  }

  if (
    (typeof expected === "string" && error.message.includes(expected)) ||
    (expected instanceof RegExp && expected.test(error.message))
  )
    return;

  fail(
    `Expected error message to match ${formatExpectedMessage(expected)}, but got: ${JSON.stringify(error.message)}`,
    assertThrows,
  );
}

function formatExpectedMessage(expectedMessage: string | RegExp): string {
  if (typeof expectedMessage === "string") {
    return JSON.stringify(expectedMessage);
  } else {
    return expectedMessage.toString();
  }
}
