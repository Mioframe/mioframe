# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a local-first personal data manager application called "Beaver" that uses modern web technologies. The application enables users to store, structure, and manage their personal data without requiring cloud storage by utilizing Origin Private File System (OPFS) technology for local browser storage.

Key features include:
- Local data storage using OPFS
- Support for various data types: string, number, boolean, date, relations
- Flexible database-like functionality with custom properties and views
- Intuitive user interface

## Project Structure

The project follows a modular structure organized by domain entities. Key directories include:

- `src/app/` - Main application entry points and routing configuration
- `src/entities/` - Domain entities representing data structures and business logic
- `src/features/` - Feature-specific implementations
- `src/shared/` - Shared components, services, and utilities
- `cypress/e2e/` - End-to-end tests using Cypress

## Development Commands

### Building the Application
```bash
pnpm build
```

### Running in Development Mode
```bash
pnpm dev
```

### Running Tests
The project uses Cypress for end-to-end testing and Vitest for unit testing:

#### End-to-End Tests (Cypress)
```bash
# Open Cypress test runner GUI
pnpm cy:open

# Run tests with interactive mode
pnpm cy:open:dev
```

#### Unit Tests (Vitest)
```bash
# Run all unit tests
pnpm test:run

# Interactive test runner
pnpm test

# Generate coverage report
pnpm test:coverage
```

## Architecture Highlights

1. **CRDT-based Data Structures**: The application uses Conflict-Free Replicated Data Types (CRDT) for data consistency and conflict resolution.

2. **Modular Entity Design**: Entities are organized by domain concepts, such as database properties (string, number, boolean), date types, relations, etc.

3. **Virtual File System Abstraction**: There's an abstraction layer that supports different storage providers through virtual filesystem implementations.

4. **Database-like Functionality**: Supports data records with custom properties and views with filtering/sorting capabilities.

## Key Implementation Details

- Uses Vue 3 for the frontend framework
- Implements a modern component-based architecture
- Leverages Automerge CRDTs for state management and conflict resolution
- Utilizes Origin Private File System (OPFS) for local storage in browsers
- Follows a clean separation of concerns between entities, services, and UI components

## Testing Strategy

The application uses both Cypress for end-to-end testing and Vitest for unit testing. Tests are organized by feature areas:

### End-to-End Tests
- Cypress tests for full user flows and integration scenarios
- Database functionality tests in `cypress/e2e/databaseDocument/`
- Property-related tests
- View management tests

### Unit Tests
- Vitest framework for unit testing of individual components, functions and services
- Located alongside the code in `__tests__/` folders following the same directory structure as source files
- Run with `pnpm test:run` command

To add new unit tests:
1. Create a `__tests__/` folder next to your component/service that needs testing
2. Add `.test.ts` files inside this folder containing your unit tests
3. Use the existing test patterns from other test files as reference