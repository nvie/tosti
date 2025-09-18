import type { Decoder } from "decoders";
import { number } from "decoders";

/**
 * Is the given value a POJO (plain old JavaScript object)?
 */
// TODO: Consider exporting this from `decoders`
export function isPojo(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    // This still seems to be the only reliable way to determine whether
    // something is a pojo... ¯\_(ツ)_/¯
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

// Custom decoders for quick number comparisons
export const gte = (n: number): Decoder<number> =>
  number.refine((value) => value >= n, `Must be >=${n}`);

export const gt = (n: number): Decoder<number> =>
  number.refine((value) => value > n, `Must be >${n}`);

export const lte = (n: number): Decoder<number> =>
  number.refine((value) => value <= n, `Must be <=${n}`);

export const lt = (n: number): Decoder<number> =>
  number.refine((value) => value < n, `Must be <${n}`);

export const between = (min: number, max: number): Decoder<number> =>
  number.reject((value) =>
    value >= min
      ? value <= max
        ? null
        : `Too high, must be <=${max}`
      : `Too low, must be >=${min}`,
  );
