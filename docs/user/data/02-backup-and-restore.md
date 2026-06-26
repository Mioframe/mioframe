# Backup and restore

This page explains how to back up one document at a time in Mioframe, and what happens when you import that backup.

## What Export JSON and Import JSON do

- **Export JSON** saves the current content of one document as a JSON file. This is a document snapshot, not a copy of Mioframe's internal storage.
- **Import JSON** creates a new Mioframe document from a JSON file. It does not restore the original document's storage identity or history — importing always adds a separate document.

These actions are document-level only. They are not a full workspace backup or full workspace restore. For how a document is stored on disk, see [Data storage](./01-data-storage.md).

## When to export a JSON backup

Export a JSON backup when a document matters to you and you want a separate copy outside the app.

Common times to export a backup include:

- before clearing browser data or changing browser profiles;
- before moving important work between devices or storage locations;
- before making major edits you may want to undo later;
- before changing local folders or storage locations outside Mioframe.

## How to back up one document

1. Open the folder or repository view that contains the document.
2. Find the document in the list.
3. Open the document options menu.
4. Choose **Export JSON**.
5. Choose where to save the exported JSON file.

Keep exported backups somewhere you control and can find again, such as:

- a normal folder you back up regularly;
- an external drive;
- a secure cloud storage location you trust.

If a document is important, keep more than one copy in places you manage.

## How to import a JSON document

1. Open the target folder in the app.
2. Open the folder options menu.
3. Choose **Import JSON**.
4. Choose the JSON file.

If the file is valid and the target location is available, Mioframe creates a new document in that folder from the JSON file.

## Important limits

- Export JSON and Import JSON work on one document at a time.
- Importing always creates a new document; it does not restore the original document's storage identity, `.mf` chunks, or edit history.
- They do not restore an entire workspace, folder structure, or browser storage state.
- Mioframe cannot recreate data that was never exported or otherwise preserved.

If import or recovery fails, see [Troubleshooting data problems](./03-data-troubleshooting.md).
