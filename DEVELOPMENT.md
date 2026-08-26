# Development

> **Status**: `CURRENT`  
> **Last Updated**: 2026-08-13  
> **Testing policy**: [`docs/testing/architecture.md`](./docs/testing/architecture.md)  
> **Testing migration state**: [`docs/testing/migration-plan.md`](./docs/testing/migration-plan.md)

## Overview

Mioframe is a Vue 3 + TypeScript local-first application. Repository rules live in `AGENTS.md` and applicable nested `AGENTS.md` files. Detailed testing ownership belongs to the testing documentation and skills; this guide only summarizes common developer commands.

## Requirements

- Node.js 24.x
- pnpm 10.x
- Git 2.x

Install dependencies with:

```bash
pnpm install
```

Git hooks are installed by the `prepare` script. If needed:

```bash
pnpm run setup:git-hooks
```

## Development server

```bash
pnpm dev
```

The default development server uses HTTPS and Vite HMR.

## Verification workflow

### Coding-agent feedback

Use verifier-managed focused checks that faithfully prove the changed contract:

```bash
pnpm verify --only <type> --files <exact-readable-paths...>
```

`<type>` is one of the eight canonical verification types: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`. See the verification skill for full usage.

Use automatic fixes only when appropriate:

```bash
pnpm verify --fix-only --base <parent-ref>
```

Inspect resulting changes. Raw Vitest, Playwright, lint, format, mutation, or other child commands are diagnostic interfaces only unless an applicable skill explicitly allows them; accepted proof returns through `pnpm verify`.

A coding agent does **not** need to run a broad local `pnpm verify --base ...` or `pnpm verify --full` merely to declare its implementation task complete. Required task-specific proof must still exist and focused checks must cover the changed contracts and risks.

### Pull-request gate

For PR work, required GitHub CI on the **exact published PR head** is the authoritative repository verification gate. The architect owns:

- PR creation/update;
- exact-head CI review;
- full resulting-PR architecture/implementation review;
- merge readiness.

A green CI run does not replace missing tests, architecture review, ownership checks, browser/visual proof, or risk-specific evidence.

If CI fails because of the PR:

1. identify the exact failed check/contract;
2. route it to the correct owner;
3. run the smallest useful verifier-managed local check while correcting it;
4. publish the correction;
5. let GitHub CI rerun on the new exact head.

Do not require a second broad local run solely to duplicate CI.

### Broad local verification

Broad commands remain available when they materially help diagnosis or confidence:

```bash
pnpm verify --base origin/develop
pnpm verify --full
```

Use the actual parent branch for stacked work. `pnpm verify --full` is the full release-verification command for build/release, routing/base-path, manifest/PWA/service-worker/channel, release-script, artifact-assembly, and other release-sensitive work. These commands are not unconditional coding-agent completion gates.

`pnpm verify` is summary-first. Failed checks print the verifier label and relevant output; rerun through the verifier boundary rather than copying a raw child command.

## Testing

Use the lowest faithful proof owner defined by [`docs/testing/architecture.md`](./docs/testing/architecture.md):

- deterministic logic and component contracts → Vitest / `unit-tests`;
- reusable browser behavior → Storybook Playwright / `storybook-behavior`;
- complete product scenarios → application Playwright / `e2e`;
- stable appearance → Storybook screenshot proof / `visual`;
- release behavior → release verification;
- mutation audits → only for applicable high-risk deterministic logic.

For Storybook ownership and placement, read [`docs/testing/storybook.md`](./docs/testing/storybook.md). Current owner-local/central migration state is defined only by [`docs/testing/migration-plan.md`](./docs/testing/migration-plan.md).

## Common manual commands

These commands are useful for interactive development and diagnosis; coding-agent accepted proof follows the verifier-managed workflow above.

```bash
pnpm test
pnpm storybook
pnpm e2e
pnpm e2e:ui
pnpm e2e:headed
pnpm test:visual
pnpm test:visual:update
```

Visual baselines must be generated only through the canonical Linux/Chromium container flow and inspected before acceptance.

## Linting and formatting

```bash
pnpm lint
pnpm format
```

Prefer focused verifier labels for coding-agent proof and `pnpm verify --fix-only` for supported automatic fixes.

## Production build

```bash
pnpm build
pnpm preview
```

## Commit messages

Use Conventional Commits:

```text
<type>(<scope>): <description>
```

Typical types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
