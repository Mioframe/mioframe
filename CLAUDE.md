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
The project uses Cypress for end-to-end testing:
```bash
# Open Cypress test runner GUI
pnpm cy:open

# Run tests with interactive mode
pnpm cy:open:dev
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

The application uses Cypress for end-to-end testing. Tests are organized by feature areas:
- Database functionality tests in `cypress/e2e/databaseDocument/`
- Property-related tests
- View management tests