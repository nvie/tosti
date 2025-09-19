import { array, either, number, string } from "decoders";
import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import { anything, assertEq, between, gt, gte, lt, lte } from "~";

import { eventually } from "./utils";

describe("assertEq w/ values", () => {
  test("passes when values are equal", () => {
    assertEq(42, 42);
    assertEq("hello", "hello");
    assertEq(true, true);
    assertEq(null, null);
    assertEq(undefined, undefined);
    assertEq(NaN, NaN); // Although NaN != NaN, Object.is(NaN, NaN) is true, so this should pass
    assertEq(0, -0);
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

  test("arrays", () => {
    assertEq([], []);
    assertEq([1, 2, 3], [1, 2, 3]);
    assertEq([[1]], [[1]]);

    expect(() => assertEq([1, 2, 3], [1, 2])).toThrow(`Assertion failed:

[
  1,
  2,
  3,
]
^ Too many elements, expected 2, got 3
`);

    expect(() => assertEq([1], [1, 2])).toThrow(`Assertion failed:

[
  1,
]
^ Too few elements, expected 2, got 1
`);
  });

  test("deep objects", () => {
    assertEq({}, {});
    assertEq({ a: 123 }, { a: 123 });
    assertEq({ b: [77] }, { b: [77] });
    assertEq({ 0: 1 }, { "0": 1 });
    assertEq({ "0": 1 }, { 0: 1 });

    expect(() => assertEq({ 1: 2, 3: 4 }, { "1": 2, "3": -4 }))
      .toThrow(`Assertion failed:

{
  "1": 2,
  "3": 4,
       ^ Must be -4
}
`);

    expect(() =>
      assertEq(
        {
          a: { b: { c: { d: { e: { f: { g: 3, h: "👋", i: [2, 2] } } } } } },
        },
        {
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: {
                      g: between(1, 2),
                      h: anything,
                      i: array(number),
                    },
                  },
                },
              },
            },
          },
        },
      ),
    ).toThrow(`Assertion failed:

{
  "a": {
    "b": {
      "c": {
        "d": {
          "e": {
            "f": {
              "g": 3,
                   ^ Too high, must be <= 2
              "h": "👋",
              "i": [
                2,
                2,
              ],
            },
          },
        },
      },
    },
  },
}
`);
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

describe("assertEq w/ promises", () => {
  test("awaits promises", async () => {
    await assertEq(eventually(42), 42);
    await assertEq(Promise.resolve(42), 42);
  });

  test("awaits failure", async () => {
    await expect(assertEq(eventually(0), 42)).rejects.toThrow(`Assertion failed:

0
^ Must be 42
`);
  });

  test("assertEq returns nothing when `actual` isn't a promise", () => {
    expect(assertEq(42, 42)).toBeUndefined();
    expect(assertEq(42, 42)).toBeUndefined();
  });

  test("assertEq returns nothing when `actual` value isn't a promise", async () => {
    await expect(assertEq(eventually(42), 42)).resolves.toBeUndefined();
    await expect(assertEq(Promise.resolve(42), 42)).resolves.toBeUndefined();
  });
});

describe("assertEq w/ RegExp", () => {
  test("handles regular expressions as expected values", () => {
    assertEq("a", /a/);
    assertEq("AaAaAaAa", /^(aa)+$/i);
    assertEq({ foo: "AaAaAaAa" }, { foo: /^(aa)+$/i });
  });

  test("handles regular expressions as expected values", () => {
    expect(() => assertEq("b", /a/i)).toThrow(`Assertion failed:

"b"
^^^ Must match /a/i
`);
    expect(() => assertEq("AaAaAaAaa", /^(aa)+$/i)).toThrow(`Assertion failed:

"AaAaAaAaa"
^^^^^^^^^^^ Must match /^(aa)+$/i
`);
  });
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
^^ Too low, must be >= 40
`,
    );

    expect(() => assertEq(58, between(40, 50))).toThrow(
      `Assertion failed:

58
^^ Too high, must be <= 50
`,
    );
  });
});

describe("properties", () => {
  test("∀x :: assertEq(x, structuredClone(x))", () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        assertEq(x, structuredClone(x)); // This should never throw
      }),
      {
        examples: [
          // Counter example 1
          [[Number.NaN]],

          // Counter example 2
          [{ ["__proto__"]: 0 }],
        ],
      },
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

  test("∀scalar :: assertEq(scalar, structuredClone(scalar))", () => {
    fc.assert(
      fc.property(fc.anything(), (scalar) => {
        fc.pre(scalar === null || typeof scalar !== "object");
        assertEq(scalar, structuredClone(scalar)); // This should never throw
      }),
    );
  });

  test("∀arr :: assertEq(arr, structuredClone(arr))", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (arr) => {
        assertEq(arr, structuredClone(arr)); // This should never throw
      }),
      {
        examples: [
          // Counter example 1 (FIXED)
          [[Number.NaN]],

          // Counter example 2 (UNDER INVESTIGATION)
          [[{ ["__proto__"]: 42 }]],
        ],
      },
    );
  });

  test("∀obj :: assertEq(obj, structuredClone(obj))", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything(), {
          noNullPrototype: true,
        }),
        (obj) => {
          assertEq(obj, structuredClone(obj)); // This should never throw
        },
      ),
      {
        examples: [
          // Counter example 1
          [Object.create(null)],

          // Counter example 2
          [{ __proto__: null }], // Same as above, but with __proto__ syntax

          // Counter example 3
          [{ ["__proto__"]: null }], // This actually creates an object with an actual __proto__ property
        ],
      },
    );
  });
});
