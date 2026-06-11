# src/shared/service

## Purpose

This directory owns background-side service implementations, worker-facing service setup, service contracts, and service client boundary types.

## Layer boundary

UI and FSD layers must access background services only through the public worker-service client boundary.

Allowed from `src/app`, `src/pages`, `src/widgets`, `src/features`, and `src/entities`:

- `@shared/service`
- `useMainServiceClient`
- transfer-safe service contracts exported by `@shared/service`

Forbidden from `src/app`, `src/pages`, `src/widgets`, `src/features`, and `src/entities`:

- direct imports from `@shared/service/*`
- relative imports into `src/shared/service/**`
- direct usage of `useFileSystemService`
- direct usage of `useRepositoriesService`
- direct usage of `useGoogleService`
- direct usage of any other background-side `use*Service` implementation

## Public service entrypoint

`@shared/service` is the public worker-service client contract.

Keep it narrow.

It may export only:

- `useMainServiceClient`
- `MainServiceClient`
- transfer-safe DTOs
- method parameter/result types
- stable error codes
- public service constants
- public service error classes that can cross the worker boundary

It must not export:

- service implementation functions
- service setup functions
- implementation barrels
- runtime helpers unrelated to the worker-service client contract
- diagnostics bridge helpers
- provider initialization helpers

Do not re-export from implementation barrels such as:

- `./fileSystem`
- `./repositories`
- `./google`

unless the barrel is contract-only. Prefer direct exports from contract-only modules.

## Contract-only modules

Public service contracts should live near their service, but outside implementation files.

Examples:

- `src/shared/service/fileSystem/fileSystemContracts.ts`
- `src/shared/service/google/googleContracts.ts`
- `src/shared/service/repositories/repositoryContracts.ts`
- `src/shared/service/directories/directoriesContracts.ts`

Contract-only modules may contain:

- DTOs
- interfaces
- type aliases
- enums
- stable error codes
- public constants
- public error classes

Contract-only modules must not import from:

- `use*Service`
- `setup*Service`
- implementation barrels
- modules that initialize service runtime state
- modules that create providers
- modules that create VFS instances
- modules that create repository instances
- modules that create global state
- modules with diagnostics side effects

Correct dependency direction:

- `@shared/service` imports contract-only modules
- service implementations import contract-only modules
- UI/FSD layers import `@shared/service`

Incorrect dependency direction:

- contract-only modules importing service implementations
- `@shared/service` importing implementation barrels
- UI/FSD layers importing service implementations

## Main-thread service clients

Main-thread bridges that exist to support worker services but must run in the browser UI runtime belong outside `src/shared/service`.

Use `src/shared/serviceClient/**` for these cases.

Examples:

- browser permission prompts
- File System Access permission recovery
- diagnostics policy bridge that applies main-runtime state and syncs worker state

Do not expose these bridges through `@shared/service` unless they are true worker-service client contracts.

## Worker transport

Worker transport transformers belong to the proxy/worker boundary.

When adding cloneable or transferable platform objects, keep the transformer minimal and verify that the service runtime receives the expected object behavior.

Examples:

- `FileSystemHandle`
- `Blob`
- `File`
- known domain errors

Do not convert selected files to plain text in feature code when the object can cross the worker boundary safely.

## Ownership rules

Service implementations own:

- storage access
- VFS operations
- repository operations
- JSON parsing when data comes from storage or imported files
- schema validation for service-owned data
- document creation/deletion/update operations
- worker-side recovery/replay integration

Feature code owns:

- user-triggered scenarios
- dialogs
- confirmations
- picker invocation that requires browser user activation
- snackbars
- feature-level error handling
- feature-level diagnostics metadata
- write-access recovery orchestration through service-client bridges

Widget code owns:

- composition of entities, features, and UI
- mapping child UI events to feature actions

Pane/page code owns:

- route-level composition
- pane layout
- navigation state

Pane/page code must not orchestrate service recovery flows or import storage data directly.

## Error and diagnostics rules

Service errors crossing the worker boundary must use stable, safe error contracts.

User-facing messages must not contain:

- file paths
- file names
- JSON content
- repository-private data
- provider-private data

Diagnostics context must not include:

- file paths
- file names
- JSON content

Raw error causes may be preserved according to the project diagnostics policy, but explicit messages, tags, breadcrumbs, and counters must remain safe.

## Verification

When changing `src/shared/service/**`, check:

- `@shared/service` does not export `use*Service` implementation functions
- `@shared/service` does not re-export implementation barrels
- contract-only files do not import implementation files
- implementation files import contracts, not the reverse
- UI/FSD layers do not import `@shared/service/*`
- UI/FSD layers do not import relative `shared/service/**`
- `pnpm lint:oxlint` passes
- focused service tests pass
- full repository verification passes before merge

Green tests alone are not architectural approval. Check the dependency direction explicitly.
