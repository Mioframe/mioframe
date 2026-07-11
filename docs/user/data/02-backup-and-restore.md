# Backup and restore

This page explains two different ways to back up your data in Mioframe: JSON document snapshots, and ZIP storage archives.

## What Export JSON and Import JSON do

- **Export JSON** saves the current content of one document as a JSON file. This is a document snapshot, not a copy of Mioframe's internal storage.
- **Import JSON** creates a new Mioframe document from a JSON file. It does not restore the original document's storage identity or history — importing always adds a separate document.

These actions are document-level only, and JSON is a content snapshot — it does not include Mioframe's internal storage files. They are not a full workspace backup or full workspace restore. For how a document is stored on disk, see [Data storage](./01-data-storage.md).

## What Export ZIP and Import ZIP do

- **Export ZIP** on a folder archives the contents of that folder — the files and sub-folders inside it, including internal Mioframe storage files (`.mf` chunks and marker files) — directly at the top of the ZIP archive. This is a storage-level export, not a document snapshot. It does not create an extra folder inside the archive named after the exported folder.
- **Export ZIP** on a document archives that document's own storage files (its `.mf` chunks) directly at the top of the ZIP archive, using their storage file names. It does not wrap them in a folder named after the document's internal id. This is not the same as Export JSON — it does not produce a JSON snapshot, and it is not meant to be opened outside Mioframe.
- **Import ZIP** is a generic storage-level directory extraction: it unpacks safe archive contents directly into the folder you choose and does not validate Mioframe document semantics. It does not create an extra folder automatically. Mioframe fully validates the archive and checks conflicts before writing.

Use ZIP when you want a faithful copy of Mioframe's own storage (for example, to restore a whole folder later). Use JSON when you want a single, portable, human-readable snapshot of one document's content.

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

## When to export a ZIP backup

Export a ZIP backup when you want a faithful copy of a folder's storage as Mioframe keeps it, for example before reorganizing or removing a folder, or as a periodic backup of a whole space.

Export a document's ZIP archive when you specifically need that one document's storage files, separate from the rest of the folder.

## How to export a folder as ZIP

1. Open the folder you want to export.
2. Open the folder options menu.
3. Choose **Export ZIP**.
4. Choose where to save the exported ZIP file.

The export can take a while for large folders. Mioframe shows progress while it prepares, reads, and packs the archive, and streams the archive to disk as it is built rather than holding the whole folder in memory at once.

If your browser does not support saving files directly to disk during export, Mioframe falls back to building the archive in memory before saving it, up to a bounded size (currently 200 MB). If a folder's exported archive would exceed that size on such a browser, the export stops with an error instead of running out of memory — use a browser with file-system access support (for example, a recent Chromium-based browser) for large folder exports.

## How to export a document as ZIP

1. Open the folder that contains the document.
2. Find the document in the list.
3. Open the document options menu.
4. Choose **Export ZIP**.
5. Choose where to save the exported ZIP file.

## How to import a ZIP archive into a folder

Import ZIP is a folder options-menu action, not an **Add** sheet action.

- To import into the folder you currently have open, use that folder's own options menu (in the app bar) → **Import ZIP**.
- To import into a sub-folder without opening it first, use that sub-folder's own options menu (next to its name in the folder listing) → **Import ZIP**.

Then choose the ZIP file.

Mioframe validates the complete archive and checks the target folder before writing. Choose **Cancel** to abort with no writes, or **Skip existing** to import non-conflicting files while leaving existing files unchanged. Existing matching folders may be reused. Import never intentionally overwrites, deletes, or renames existing files, but provider and concurrent filesystem changes cannot be globally atomic. Provider filename and matching rules can differ, so an empty folder remains the most predictable restore target.

If a provider operation fails after writing has started, Import ZIP stops immediately instead of continuing or retrying automatically. Mioframe reports a count summary of files and folders that completed before the stop, not a list of individual completed paths. The target folder may then contain a partially imported archive, so importing the same archive into that folder again is not safe — choose an empty target folder to retry the import cleanly.

## Important limits

- Export JSON and Import JSON work on one document at a time, as a content snapshot.
- Importing a JSON file always creates a new document; it does not restore the original document's storage identity, `.mf` chunks, or edit history.
- Export ZIP and Import ZIP work at the storage level: raw files for a folder, or raw storage files for one document. They are not a document content snapshot and cannot be opened as a normal document file.
- Import ZIP is file-level extraction, not Mioframe semantic validation. If storage chunks for the same Automerge document identity coexist, Automerge can combine available history when the repository opens.
- On browsers without file-system access support, Export ZIP falls back to a bounded in-memory archive (currently 200 MB) instead of streaming to disk; exports larger than that fail with an error on those browsers.
- Mioframe cannot recreate data that was never exported or otherwise preserved.

If import or recovery fails, see [Troubleshooting data problems](./03-data-troubleshooting.md).
