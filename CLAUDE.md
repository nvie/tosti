# Commands

- npm run test: run the unit tests with coverage
- npm run test:watch: run tests in watch mode with coverage
- npm run test:types: run type-level tests with tsd
- npm run build: build the library for distribution
- npm run lint: check code formatting and linting
- npm run format: fix code formatting and linting issues
- npm run lint:package: check that the package is correct for publishing

# Project Overview

This is `tosti`, a simple assertion library for use in Vitest unit tests.

# Architecture

- `src/assertions.ts`: Core assertion functions and TostiError class
- `src/standard-schema.ts`: Vendored Standard Schema V1 types
- `src/index.ts`: Main entry point with exports
- `test/`: Unit tests with 100% coverage requirement
- `test-d/`: TypeScript type-level tests

# Important

- 100% test coverage requirement
- Strict TypeScript configuration
