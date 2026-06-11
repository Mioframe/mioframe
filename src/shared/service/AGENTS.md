# src/shared/service

## Purpose

This directory contains background-side service implementations, worker service setup, and public service contracts.

## Public boundary

UI and FSD layers (`app`, `pages`, `widgets`, `features`, `entities`) must access background services only through `@shared/service` and `useMainServiceClient`.

They must not import service implementation modules directly or through relative paths.

Forbidden from UI/FSD layers:

- `@shared/service/*`
- relative imports into `src/shared/service/**`
- `useFileSystemService`
- `useRepositoriesService`
- `useGoogleService`
- any other background-side `use*Service`

## Public service contracts

`@shared/service` is the public worker-service client contract.

It may export:

- `useMainServiceClient`
- `MainServiceClient`
- service DTOs
- method parameter/result types
- stable error codes
- public service constants
- public service error classes that cross the worker boundary

It must not export:

- `use*Service` implementation functions
- service setup functions
- implementation barrels
- runtime helpers unrelated to the worker-service client contract

## Contract-only modules

Public contracts should live in contract-only modules near the owning service.

Examples:

- `fileSystemContracts.ts`
- `googleContracts.ts`
- `repositoryContracts.ts`
- `directoriesContracts.ts`

Contract-only modules must not import from service implementation files.

Correct direction:

- `@shared/service` imports contract-only modules
- service implementations import contract-only modules

Incorrect direction:

- contract-only modules import `use*Service`
- `@shared/service` re-exports implementation barrels

## Main-thread bridges

Main-thread helpers that support service flows but require browser runtime APIs belong outside `src/shared/service`.

Use `src/shared/serviceClient/**` for browser permission prompts, File System Access recovery, and similar client-side bridges.

## Verification

When changing this directory, check:

- `@shared/service` does not export service implementations
- contract-only modules do not import implementation files
- UI/FSD layers do not import `@shared/service/*`
- UI/FSD layers do not import relative `shared/service/**`
- `pnpm lint:oxlint` passes
