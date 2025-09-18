import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import { assertEq } from "~";

describe("assertEq", () => {
  test("passes when values are equal", () => {
    assertEq(42, 42);
    assertEq("hello", "hello");
    assertEq(true, true);
    assertEq(null, null);
    assertEq(undefined, undefined);
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
