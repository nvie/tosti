import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import { assertSame } from "~";

import { eventually } from "./utils";

describe("assertSame", () => {
  test("passes when values are equal", () => {
    assertSame(42, 42);
    assertSame("hello", "hello");
    assertSame(true, true);
    assertSame(null, null);
    assertSame(undefined, undefined);
    assertSame(NaN, NaN); // Although NaN != NaN, Object.is(NaN, NaN) is true, so this should pass
  });

  test("throws when values are not equal", () => {
    expect(() => {
      assertSame(42, 43);
    }).toThrow(`Assertion failed:

42
^^ Must be 43
`);

    expect(() => {
      assertSame({ a: 1 }, { a: 1 });
    }).toThrow(`Assertion failed:

{
  "a": 1,
}
^ Value is equal, but not the same reference
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

  test("uses strict equality, via Object.is semantics", () => {
    expect(() => assertSame(0, false)).toThrow();
    expect(() => assertSame("", false)).toThrow();
    expect(() => assertSame(1, "1")).toThrow();
    expect(() => assertSame(0, -0)).toThrow(); // assertSame(0, -0) throws, but assertEq(0, -0) does not
  });

  test("throws with symbols", () => {
    const sym1 = Symbol("test");
    const sym2 = Symbol("test");
    assertSame(sym1, sym1);
    assertSame(sym2, sym2);
    expect(() => assertSame(sym1, sym2)).toThrow();
  });

  test("throws with functions", () => {
    const fn1 = () => undefined;
    const fn2 = () => undefined;
    assertSame(fn1, fn1);
    assertSame(fn2, fn2);
    expect(() => assertSame(fn1, fn2)).toThrow();
  });
});

describe("assertSame w/ promises", () => {
  test("awaits promises", async () => {
    await assertSame(eventually(42), 42);
    await assertSame(Promise.resolve(42), 42);
  });

  test("awaits failure", async () => {
    await expect(assertSame(eventually(0), 42)).rejects
      .toThrow(`Assertion failed:

0
^ Must be 42
`);
  });

  test("awaits failure with equal but not same reference", async () => {
    await expect(assertSame(eventually({ a: 1 }), { a: 1 })).rejects
      .toThrow(`Assertion failed:

{
  "a": 1,
}
^ Value is equal, but not the same reference
`);
  });

  test("assertSame returns nothing when `actual` isn't a promise", () => {
    expect(assertSame(42, 42)).toBeUndefined();
    expect(assertSame(42, 42)).toBeUndefined();
  });

  test("assertSame returns nothing when `actual` value isn't a promise", async () => {
    await expect(assertSame(eventually(42), 42)).resolves.toBeUndefined();
    await expect(assertSame(Promise.resolve(42), 42)).resolves.toBeUndefined();
  });
});

describe("properties", () => {
  test("∀a :: assertSame(a, a)", () => {
    fc.assert(
      fc.property(fc.anything(), (a) => {
        assertSame(a, a); // This should never throw
      }),
      {
        examples: [
          // Counter example 1
          [NaN],
        ],
      },
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
