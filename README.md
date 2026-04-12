# Beaver

Local-first Personal Data Manager

[Open App](https://vyachean.github.io/beaver/)

## About the Project

Beaver is a locally-oriented application for managing personal data, developed using modern web technologies. It provides users with the ability to store, structure, and manage their data without the need for cloud storage. The application uses Origin Private File System (OPFS) technology to store data locally in the browser.

## Key Features

- **Local Data Storage**: All data is stored locally in the user's browser
- **Support for Various Data Types**: String, number, boolean value, date, relation to other records
- **Flexible Data Structure**: Ability to create custom properties and views
- **Intuitive Interface**: Simple and easy-to-use data management
- **Support for Various Storage Types**: Includes support for OPFS and potentially other providers

## Getting Started

### Requirements

- Node.js
- pnpm 10

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Vyachean/self-base.git
```

2. Install dependencies:

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Starts the local HTTPS Vite development server.

### Production Build

```bash
pnpm build
pnpm preview
```

### Running Tests

```bash
# Vitest watch mode
pnpm test

# Vitest single run
pnpm test:run

# Vitest with coverage
pnpm test:coverage
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

`Vitest` is the default place for unit and integration coverage of internal logic, services, VFS, adapters, and composables. `Playwright` is reserved for browser smoke and end-to-end flows that exercise the app through the UI like a user would.

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

## Implemented Features and Plans

- [x] Using Conflict-Free Replicated Data Types (CRDT)
- [x] Storage in the browser
- [x] Local storage
  - [x] on PC
  - [x] on mobile devices
- [ ] Cloud storage
  - [ ] Synchronization with Google Drive
- [ ] Data in JSON format
  - [ ] Editing with [vanilla-jsoneditor](https://github.com/josdejong/svelte-jsoneditor)
- [x] Databases
  - Data properties
    - Adding properties:
      - [x] Strings (string)
      - [x] Numbers (number)
      - [x] Boolean values (boolean)
      - [x] Date and time
      - [ ] Selection lists
      - [ ] Links
      - [x] Relations with other tables
      - [ ] Calculated properties
    - [x] Removing properties
    - [x] Editing properties
  - Data records
    - [x] Adding record
    - [x] Removing record
    - [x] Editing record
  - Data views
    - [x] Adding view
    - [x] Renaming view
    - [x] Removing view
    - [x] Sorting views
    - [x] Sorting data by values
    - [ ] Manual sorting
    - [x] Filtering by value
    - [x] Table view
      - [ ] Hiding columns
      - [ ] Sorting columns
    - [ ] Card gallery

## License

Functional Source License (FSL) - 3 years non-compete term.
