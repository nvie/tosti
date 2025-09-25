import type { Decoder } from "decoders";
import {
  constant,
  date,
  exact,
  inexact,
  instanceOf,
  isDecoder,
  isPlainObject,
  poja,
  pojo,
  regex,
  tuple,
  unknown,
} from "decoders";

import { mapValues } from "./utils";

export type Expector = Decoder<unknown>;

const nanExpector: Expector = unknown.refine(
  (x) => Number.isNaN(x as number),
  "Must be NaN",
);

/**
 * Wrapper to treat the passed in schema or regex as a literal value.
 */
export function literally(expected: unknown): Expector {
  // NaN is a weird one, because Object.is(NaN, NaN) is true
  if (Number.isNaN(expected)) return nanExpector;

  // @ts-expect-error Normally constant() is used only with scalar values
  // In this case, however, it's fine to just use it for any literal value
  return constant(expected);
}

/**
 * Builds an expector that partially matches input. At the very least, all
 * provided fields need to be present in the actual value, but more keys are
 * allowed.
 */
export function partially(expected: Record<PropertyKey, unknown>): Expector {
  return pojo.pipe(inexact(mapValues(expected, makeExpector)));
}

function makeArrayExpector(expected: unknown[]): Expector {
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
        ...expected.map((v) => makeExpector(v)),
      ),
    );
}

// TODO Unit test this one, and make it more robust (duplicates, ordering, etc)
function makeSetExpector(expected: Set<unknown>): Expector {
  const arrComparingExpector = makeExpector(Array.from(expected));
  return instanceOf(Set).transform(Array.from).pipe(arrComparingExpector);
}

// TODO Unit test this one, and make it more robust!
function makeMapExpector(expected: Map<unknown, unknown>): Expector {
  const objComparingExpector = makeExpector(Object.fromEntries(expected));
  return instanceOf(Map)
    .transform(Object.fromEntries)
    .pipe(objComparingExpector);
}

function makeDateExpector(expected: Date): Expector {
  return date.reject((d) =>
    d.getTime() === expected.getTime()
      ? null
      : `Must be new Date('${expected.toISOString()}')`,
  );
}

function makeObjectExpector(expected: Record<PropertyKey, unknown>): Expector {
  return pojo.pipe(exact(mapValues(expected, makeExpector)));
}

function makeRegexExpector(expectedValue: RegExp): Expector {
  return regex(expectedValue, `Must match ${expectedValue.toString()}`);
}

export function makeExpector(expectedValue: unknown): Expector {
  // If it's already a decoder, nothing to build here
  if (isDecoder(expectedValue)) return expectedValue;

  if (Array.isArray(expectedValue)) return makeArrayExpector(expectedValue);
  if (isPlainObject(expectedValue)) return makeObjectExpector(expectedValue);
  if (expectedValue instanceof Set) return makeSetExpector(expectedValue);
  if (expectedValue instanceof Map) return makeMapExpector(expectedValue);
  if (expectedValue instanceof RegExp) return makeRegexExpector(expectedValue);
  if (expectedValue instanceof Date) return makeDateExpector(expectedValue);

  // Everything else is treated as a literal value
  throw new Error(
    `Don't know how to build an expector for ${String(expectedValue)} this value out of the box`,
  );
}
