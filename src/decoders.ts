import type { Decoder } from "decoders";
import { number } from "decoders";

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
