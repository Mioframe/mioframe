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
- pnpm

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

### Production Build

```bash
pnpm build
```

### Running Tests

```bash
pnpm cy:open
```

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
