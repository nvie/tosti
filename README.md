<p align="center">
  <img src="./assets/tosti.png" alt="Tosti project logo" style="max-width: 384px" />
</p>

# Tosti

[![npm](https://img.shields.io/npm/v/tosti.svg)](https://www.npmjs.com/package/tosti)
[![license](https://img.shields.io/npm/l/tosti.svg)](https://github.com/nvie/tosti/blob/main/LICENSE)
[![Code Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/nvie/tosti)

A simple, powerful assertion library for Vitest (or any other test runner) that provides clear error messages and type-safe assertions.

## Features

- 🤸‍♂️ **Flexible matching** - Supports exact values, patterns, and custom expectors
- 🎯 **Clear error messages** - Beautiful, readable assertion failures
- 🔋 **100% test coverage** - Thoroughly tested and reliable

## Installation

```bash
npm install tosti
```

## Quick Start

```typescript
import { assertEq, assertSame, assertThrows } from "tosti";

// Basic equality assertions
assertEq(42, 42); // ✅ passes
assertEq([1, 2, 3], [1, 2, 3]); // ✅ passes - deep equality
assertEq("hello", /^hel/); // ✅ passes - regex matching

// Reference equality
assertSame(obj, obj); // ✅ passes - same reference
assertSame(NaN, NaN); // ✅ passes - Object.is comparison

// Exception assertions
assertThrows(() => {
  // ✅ passes
  throw new Error("Something went wrong");
}, "went wrong");

// Async support
await assertEq(Promise.resolve(42), 42); // ✅ passes
await assertThrows(() => {
  // ✅ passes
  return Promise.reject(new Error("Async error"));
}, /Async/);
```

## API Reference

### `assertEq(actual, expected)`

Asserts that two values are deeply equal. Supports complex objects, arrays, dates, and pattern matching.

```typescript
// Basic values
assertEq(42, 42);
assertEq("hello", "hello");
assertEq(true, true);

// Deep equality
assertEq({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] });
assertEq([1, 2, 3], [1, 2, 3]);

// Pattern matching
assertEq("hello world", /world$/);
assertEq("test@example.com", /\w+@\w+\.\w+/);

// Date objects
assertEq(new Date("2025-01-01"), new Date("2025-01-01"));

// With custom expectors (these are built-in, but you can create your own)
import { between, gt, gte, lt, lte } from "tosti";

assertEq(42, between(40, 50)); // 40 <= 42 <= 50
assertEq(100, gt(50)); // 100 > 50
assertEq(25, gte(25)); // 25 >= 25
assertEq(10, lt(20)); // 10 < 20
assertEq(15, lte(15)); // 15 <= 15

// Async support
await assertEq(Promise.resolve(42), 42);
await assertEq(async () => 42, 42);
```

**Error messages are designed to be beautiful**

```typescript
assertEq({ a: 42 }, { a: between(0, 40) });
// TostiError: Assertion failed:
//
// {
//   a: 42,
//      ^^ Too high, must be <= 40
// }
```

---

### `assertSame(actual, expected)`

Asserts that two values are referentially equal using `Object.is()` comparison.

```typescript
const obj = { a: 1 };
assertSame(obj, obj); // ✅ same reference
assertSame(42, 42); // ✅ same primitive value
assertSame(NaN, NaN); // ✅ Object.is handles NaN correctly
assertSame(0, -0); // ❌ throws (but using assertEq would pass)

// Async support
await assertSame(Promise.resolve(obj), obj);
```

**Error example:**

```typescript
assertSame({ a: 1 }, { a: 1 });
// TostiError: Assertion failed:
//
// {
//   "a": 1,
// }
// ^ Value is equal, but not the same reference
```

---

### `assertThrows(thunk, expectedMessage)`

Asserts that a function throws an error with a message matching the expected pattern.

```typescript
// String matching (substring)
assertThrows(() => {
  throw new Error("Something went wrong");
}, "went wrong"); // ✅ contains substring

// Regex matching
assertThrows(() => {
  throw new Error("Network timeout");
}, /^Network/); // ✅ matches pattern

// Exact error messages
assertThrows(() => {
  throw new Error("File not found");
}, "File not found"); // ✅ exact match

// Validates error types
assertThrows(() => {
  throw "string error"; // ❌ not an Error object
}, "string error");
// TostiError: Expected function to throw an Error, but it threw: "string error"

// Async support
await assertThrows(() => {
  return Promise.reject(new Error("Async failure"));
}, "Async failure");

await assertThrows(async () => {
  throw new Error("Async error");
}, /Async/);
```

**Error Examples:**

```typescript
// Function doesn't throw
assertThrows(() => 42, "should throw");
// TostiError: Expected function to throw an error, but it did not throw

// Wrong error message
assertThrows(() => {
  throw new Error("Actual message");
}, "Expected message");
// TostiError: Expected error message to match "Expected message", but got: "Actual message"
```

## Validation

Tosti includes several built-in expectors. Ultimately expectors are just
decoders, which allow for easy composition and building your own custom
expectors.

```typescript
import { anything, between, gt, gte, lt, lte } from "tosti";

// Numeric comparisons
assertEq(42, gt(40)); // greater than
assertEq(42, gte(42)); // greater than or equal
assertEq(42, lt(50)); // less than
assertEq(42, lte(42)); // less than or equal
assertEq(42, between(40, 50)); // inclusive range

// Wildcard matching
assertEq(
  // Actual
  {
    a: 1,
    b: "whatever",
    c: "hello, world!",
    d: "223f8530-9f90-46cd-bd3c-6bc4aed5e1fe",
  },

  // Expected
  {
    a: 1,
    b: anything,
    c: /^(hi|hello), world!$/i,
    d: optional(uuid),
  },
);
```

## Async/Promise Support

All assertions work seamlessly with promises and async functions:

```typescript
// Promise values
await assertEq(Promise.resolve(42), 42);
await assertSame(Promise.resolve(obj), obj);

// Async functions
await assertEq(async () => 42, 42);

// Promise rejections
await assertThrows(() => {
  return Promise.reject(new Error("Async error"));
}, "Async error");

// Async function exceptions
await assertThrows(async () => {
  throw new Error("Async throw");
}, /Async/);
```

## Error Messages

Tosti provides clear, formatted error messages that pinpoint exactly what went wrong:

```typescript
assertEq({ a: { b: { c: 42 } } }, { a: { b: { c: 43 } } });
// TostiError: Assertion failed:
//
// {
//   "a": {
//     "b": {
//       "c": 42,
//            ^^ Must be 43
//     },
//   },
// }
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
