import { _annotate, formatInline, isPromiseLike } from "decoders";

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
  if (Object.is(actual, expected)) return;

  // Check if values are deeply equal but not the same reference
  const deepEqualityResult = makeExpector(expected).decode(actual);
  if (deepEqualityResult.ok) {
    // Format the message to match the expected pattern with trailing comma
    const formattedActual = JSON.stringify(actual, null, 2).replace(
      /(\n {2}"[^"]+": [^,\n]+)(\n})/g,
      "$1,$2",
    );
    fail(
      `${formattedActual}\n^ Value is equal, but not the same reference`,
      assertSame,
    );
  } else {
    // Use the standard error from literally decoder
    const result = literally(expected).decode(actual);
    // This should always fail since we know Object.is failed and deep equality failed
    fail(formatInline(result.error!), assertSame);
  }
}

export async function assertSame_async(
  actual$: PromiseLike<unknown>,
  expected: unknown,
): Promise<void> {
  const actual = await actual$;
  if (Object.is(actual, expected)) return;

  // If we get here, there's definitely an error to display. The question
  // however is which error we'll show. To be maximally user-friendly, we check
  // if the actual and expected values deeply equal. To a developer it might be
  // an important clue that the value actually is equal, but not the same. As
  // opposed to not even being equal in the first place.
  const deepEqualityResult = makeExpector(expected).decode(actual);
  if (deepEqualityResult.ok) {
    fail(
      formatInline(
        _annotate(actual, "Value is equal, but not the same reference"),
      ),
      assertSame,
    );
  }

  const result = literally(expected).decode(actual);
  if (result.ok) {
    throw new Error("This should never happen. Please report a bug!");
  }
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
