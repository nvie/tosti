import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import { assertSame } from "~";

describe("assertSame", () => {
  test("passes when values are equal", () => {
    assertSame(42, 42);
    assertSame("hello", "hello");
    assertSame(true, true);
    assertSame(null, null);
    assertSame(undefined, undefined);
  });

  test("throws when values are not equal", () => {
    expect(() => {
      assertSame(42, 43);
    }).toThrow(`Assertion failed:

42
^^ Must be 43
`);

    expect(() => {
      assertSame("hello", "world");
    }).toThrow(`Assertion failed:

"hello"
^^^^^^^ Must be 'world'
`);

    expect(() => {
      assertSame(true, false);
    }).toThrow(`Assertion failed:

true
^^^^ Must be false
`);

    expect(() => {
      assertSame(null, undefined);
    }).toThrow(`Assertion failed:

null
^^^^ Must be undefined
`);
  });

  test("uses strict equality (===)", () => {
    expect(() => {
      // @ts-expect-error deliberate wrong type
      assertSame(0, false);
    }).toThrow();

    expect(() => {
      // @ts-expect-error deliberate wrong type
      assertSame("", false);
    }).toThrow();

    expect(() => {
      // @ts-expect-error deliberate wrong type
      assertSame(1, "1");
    }).toThrow();
  });
});

describe("properties", () => {
  test("∀a :: assertSame(a, a)", () => {
    fc.assert(
      fc.property(fc.anything(), (a) => {
        assertSame(a, a); // This should never throw
      }),
    );
  });

  test("∀a,b :: a != b → !assertSame(a, b)", () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (a, b) => {
        fc.pre(a !== b); // Only test when a !== b

        expect(() => assertSame(a, b)).toThrow();
      }),
    );
  });

  test("∀a,b :: !Object.is(a, b) → !assertSame(a, b)", () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (a, b) => {
        fc.pre(!Object.is(a, b)); // Only test when !Object.is(a, b)

        expect(() => assertSame(a, b)).toThrow();
      }),
    );
  });
});
