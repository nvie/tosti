import { describe, expect, test } from "vitest";

import { assertThrows } from "~";

describe("assertThrows", () => {
  test("passes when function throws with matching string message", () => {
    assertThrows(() => {
      throw new Error("Something went wrong");
    }, "Something went wrong");

    assertThrows(() => {
      throw new Error("Something went wrong");
    }, "went wrong");

    assertThrows(() => {
      throw new Error("Something went wrong");
    }, "Something");
  });

  test("passes when function throws with matching RegExp message", () => {
    assertThrows(() => {
      throw new Error("Something went wrong");
    }, /went wrong/);

    assertThrows(() => {
      throw new Error("Something went wrong");
    }, /^Something/);

    assertThrows(() => {
      throw new Error("Something went wrong");
    }, /wrong$/);

    assertThrows(() => {
      throw new Error("Something went wrong");
    }, /.*went.*/);
  });

  test("throws when function does not throw", () => {
    expect(() => {
      assertThrows(() => 42, "error message");
    }).toThrow(
      "Assertion failed:\n\nExpected function to throw an error, but it did not throw",
    );

    expect(() => {
      assertThrows(() => 42, /error/);
    }).toThrow(
      "Assertion failed:\n\nExpected function to throw an error, but it did not throw",
    );
  });

  test("throws when function throws non-Error", () => {
    expect(() => {
      assertThrows(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error";
      }, "string error");
    }).toThrow(
      'Assertion failed:\n\nExpected function to throw an Error, but it threw: "string error"',
    );

    expect(() => {
      assertThrows(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 42;
      }, "42");
    }).toThrow(
      "Assertion failed:\n\nExpected function to throw an Error, but it threw: 42",
    );

    expect(() => {
      assertThrows(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw null;
      }, "null");
    }).toThrow(
      "Assertion failed:\n\nExpected function to throw an Error, but it threw: null",
    );
  });

  test("throws when error message doesn't match string", () => {
    expect(() => {
      assertThrows(() => {
        throw new Error("Something went wrong");
      }, "different message");
    }).toThrow(
      'Assertion failed:\n\nExpected error message to match "different message", but got: "Something went wrong"',
    );
  });

  test("throws when error message doesn't match RegExp", () => {
    expect(() => {
      assertThrows(() => {
        throw new Error("Something went wrong");
      }, /different/);
    }).toThrow(
      'Assertion failed:\n\nExpected error message to match /different/, but got: "Something went wrong"',
    );
  });
});
