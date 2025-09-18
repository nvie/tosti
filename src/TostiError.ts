class TostiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TostiError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function fail(message: string, assertFn: Function): never {
  const err = new TostiError(`Assertion failed:\n\n${message}\n`);

  /* istanbul ignore if -- @preserve */
  if (
    "captureStackTrace" in Error &&
    typeof Error.captureStackTrace === "function"
  ) {
    Error.captureStackTrace(err, assertFn);
  }
  throw err;
}
