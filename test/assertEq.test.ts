import { either, number, string } from "decoders";
import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import { assertEq, between, gt, gte, lt, lte } from "~";

describe("assertEq w/ values", () => {
  test("passes when values are equal", () => {
    assertEq(42, 42);
    assertEq("hello", "hello");
    assertEq(true, true);
    assertEq(null, null);
    assertEq(undefined, undefined);
  });

  // TODO Fix this!
  test.skip("TODO: NaN is weird, fix this later", () => {
    assertEq(NaN, NaN); // Object.is(NaN, NaN) is true, so this should pass
  });

  test("throws beautiful error when types don't match", () => {
    expect(() => {
      assertEq(null, undefined);
    }).toThrow(
      `Assertion failed:

null
^^^^ Must be undefined
`,
    );

    expect(() => {
      assertEq(undefined, null);
    }).toThrow(
      `Assertion failed:

undefined
^^^^^^^^^ Must be null
`,
    );
  });

  test("throws beautiful error when types don't match", () => {
    expect(() => {
      assertEq(42, new Date());
    }).toThrow(
      `Assertion failed:

42
^^ Must be a Date
`,
    );
  });

  test("throws beautiful error when Date values don't match", () => {
    expect(() => {
      assertEq(new Date("2025-01-01"), new Date("2025-01-02"));
    }).toThrow(
      `Assertion failed:

new Date('2025-01-01T00:00:00.000Z')
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Must be new Date('2025-01-02T00:00:00.000Z')
`,
    );
  });

  test("throws when values are not equal", () => {
    expect(() => assertEq(42, 43)).toThrow(
      `Assertion failed:

42
^^ Must be 43
`,
    );
  });

  test("symbols", () => {
    const sym1 = Symbol("test");
    const sym2 = Symbol("test");
    assertEq(sym1, sym1);
    assertEq(sym2, sym2);
    expect(() => assertEq(sym1, sym2)).toThrow();
  });

  test("functions", () => {
    const fn1 = () => undefined;
    const fn2 = () => undefined;
    assertEq(fn1, fn1);
    assertEq(fn2, fn2);
    expect(() => assertEq(fn1, fn2)).toThrow();
  });

  test("compares Date objects specially", () => {
    const sameDate1 = new Date("2025-01-01");
    const sameDate2 = new Date("2025-01-01");
    const differentDate = new Date("2025-01-02");

    assertEq(sameDate1, sameDate2);

    expect(() => {
      assertEq(sameDate1, differentDate);
    }).toThrow(`Assertion failed:

new Date('2025-01-01T00:00:00.000Z')
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Must be new Date('2025-01-02T00:00:00.000Z')
`);
  });

  // TODO Implement this?
  //   test("can use decoders to match", () => {
  //     expect(() => {
  //       assertEq(
  //         {
  //           a: 42,
  //         },
  //         {
  //           a: 42,
  //           b: poja,
  //           c: /^hello/,
  //         },
  //       );
  //     }).toThrow(
  //       `Assertion failed:
  //
  // 42
  // ^^ Must be a Date
  // `,
  //     );
  // });
});

describe("assertEq w/ decoders", () => {
  test("handles decoders as expected values", () => {
    assertEq(42, either(number, string));
    assertEq(42, number);
    assertEq(42, gte(40));
    assertEq(42, gt(40));
    assertEq(42, lt(100));
    assertEq(42, lte(100));
    assertEq(42, between(40, 50));
  });

  test("handles Date objects specially", () => {
    // This should use the decoder directly
    expect(() => assertEq("not a number", number)).toThrow(
      `Assertion failed:

"not a number"
^^^^^^^^^^^^^^ Must be number
`,
    );

    expect(() => assertEq("not a number", between(40, 50))).toThrow(
      `Assertion failed:

"not a number"
^^^^^^^^^^^^^^ Must be number
`,
    );

    expect(() => assertEq(32, between(40, 50))).toThrow(
      `Assertion failed:

32
^^ Too low, must be >=40
`,
    );

    expect(() => assertEq(58, between(40, 50))).toThrow(
      `Assertion failed:

58
^^ Too high, must be <=50
`,
    );
  });
});

describe("properties", () => {
  // TODO: Make this one pass later
  test.skip("∀x :: assertEq(x, structuredClone(x))", () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        assertEq(x, structuredClone(x)); // This should never throw
      }),
    );
  });

  test("∀x, y :: t(x) != t(y) → !assertEq(x, y)", () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (x, y) => {
        fc.pre(typeof x !== typeof y || (x === null) !== (y === null));
        expect(() => assertEq(x, y)).toThrow();
      }),
    );
  });

  test("∀x, y :: t(x) = t(y) ∧ x != y → !assertEq(x, y)", () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (x, y) => {
        fc.pre(typeof x === typeof y);
        fc.pre(x !== y);
        expect(() => assertEq(x, y)).toThrow();
      }),
    );
  });

  test("∀scalar :: assertEq(scalar, structuredClone(scalar))", () => {
    fc.assert(
      fc.property(fc.anything(), (scalar) => {
        fc.pre(scalar === null || typeof scalar !== "object");
        assertEq(scalar, structuredClone(scalar)); // This should never throw
      }),
    );
  });

  // TODO: Make this one pass later
  test.skip("∀arr :: assertEq(arr, structuredClone(arr))", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (arr) => {
        assertEq(arr, structuredClone(arr)); // This should never throw
      }),
    );
  });

  // TODO: Make this one pass later
  test.skip("∀obj :: assertEq(obj, structuredClone(obj))", () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.anything()), (obj) => {
        assertEq(obj, structuredClone(obj)); // This should never throw
      }),
    );
  });
});
