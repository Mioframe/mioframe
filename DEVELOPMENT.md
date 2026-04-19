# Development

## Requirements

- Node.js
- pnpm 10

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Vyachean/self-base.git
```

2. Install dependencies:

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Starts the local HTTPS Vite development server.

## Production Build

```bash
pnpm build
pnpm preview
```

## Running Tests

```bash
# Vitest watch mode
pnpm test

# Vitest single run
pnpm test:run

# Vitest with coverage
pnpm test:coverage

# StrykerJS mutation testing
pnpm test:mutate

# Dry-run the StrykerJS configuration
pnpm exec stryker run --dryRunOnly

# Narrow the mutation scope from the terminal when needed
pnpm exec stryker run -m "src/shared/lib/**/*.ts"
```

Browser smoke and end-to-end scenarios run with Playwright:

```bash
# Install the Playwright browser once per machine
pnpm e2e:install

# Run browser e2e in headless mode
pnpm e2e

# Open the Playwright UI runner
pnpm e2e:ui

# Run the same suite headed for local debugging
pnpm e2e:headed
```

`Vitest` is the default place for unit and integration coverage of internal logic, services, VFS, adapters, and composables. `Playwright` is reserved for browser smoke and end-to-end flows that exercise the app through the UI like a user would. `pnpm test:mutate` runs StrykerJS with the dynamic `stryker.config.mjs`, which derives mutation targets from colocated `*.test.ts` files, excludes `src/shared/ui`, and lets you narrow the scope further with CLI flags such as `-m`.

## Linting and Formatting

This project uses `oxlint` and `eslint` for linting, and `oxfmt` for formatting. The following commands are available:

```bash
# Run the full lint pipeline
pnpm lint

# Run only oxlint
pnpm lint:oxlint

# Run only eslint
pnpm lint:eslint

# Format files with oxfmt
pnpm format
```

For targeted fixes on touched files, prefer direct commands such as `pnpm exec eslint --fix <path ...>`, `pnpm exec oxlint <path ...>`, and `pnpm exec oxfmt <path ...>`.
