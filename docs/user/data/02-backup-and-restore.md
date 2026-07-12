# Backup and restore

This page explains two different ways to back up your data in Mioframe: JSON document snapshots, and ZIP storage archives.

## What Export JSON and Import JSON do

- **Export JSON** saves the current content of one document as a JSON file. This is a document snapshot, not a copy of Mioframe's internal storage.
- **Import JSON** creates a new Mioframe document from a JSON file. It does not restore the original document's storage identity or history — importing always adds a separate document.

These actions are document-level only, and JSON is a content snapshot — it does not include Mioframe's internal storage files. They are not a full workspace backup or full workspace restore. For how a document is stored on disk, see [Data storage](./01-data-storage.md).

## What Export ZIP and Import ZIP do

- **Export ZIP** on a folder archives the contents of that folder — the files and sub-folders inside it, including internal Mioframe storage files and marker files — directly at the top of the ZIP archive. This is a storage-level export, not a document snapshot. It does not create an extra folder inside the archive named after the exported folder.
- **Export ZIP** on a document archives the physical storage files selected for that document by Mioframe's repository storage policy, directly at the top of the ZIP archive and using their existing storage filenames. Current storage normally uses `.mf` files; older compatible spaces may contain legacy storage filenames. The archive is not wrapped in a folder named after the document's internal id. This is not the same as Export JSON: its contents are internal storage files, not a portable or human-readable document format.
- **Import ZIP** is a generic storage-level directory extraction. It checks ZIP structure, safe relative paths, path consistency, conflicts, and safety limits, then places accepted archive contents directly into the folder you choose. It does not validate Mioframe document semantics and does not create an extra folder automatically.

Use ZIP when you want a storage-level copy of file contents and directory structure, for example to restore a whole folder later. Use JSON when you want a single, portable, human-readable snapshot of one document's content.

ZIP export preserves file bytes, storage filenames, directory structure, and empty directories where applicable. It does not preserve filesystem permissions, timestamps, or symbolic links.

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

Export a ZIP backup when you want a storage-level copy of a folder's file contents and directory structure, for example before reorganizing or removing a folder, or as a periodic backup of a whole space.

Export a document's ZIP archive when you specifically need that one document's physical storage files, separate from the rest of the folder.

## How to export a folder as ZIP

1. Open the folder you want to export.
2. Open the folder options menu.
3. Choose **Export ZIP**.
4. Choose where to save the exported ZIP file.

The export can take a while for large folders. Mioframe shows progress while it prepares, reads, packs, and saves the archive. When the browser supports direct file-system saving, archive chunks are streamed to the selected file instead of holding the full archive in memory.

If the browser does not support direct file-system saving, Mioframe falls back to building the archive in memory before saving it, up to 200 MiB (about 210 MB). If the exported archive would exceed that size on such a browser, the export stops with an error instead of continuing to consume memory. Use a browser with direct file-system saving support, such as a recent Chromium-based browser, for larger exports.

## How to export a document as ZIP

1. Open the folder that contains the document.
2. Find the document in the list.
3. Open the document options menu.
4. Choose **Export ZIP**.
5. Choose where to save the exported ZIP file.

## How to import a ZIP archive into a folder

Import ZIP is a folder options-menu action, not an **Add** sheet action.

- To import into the folder you currently have open, use that folder's own options menu in the app bar, then choose **Import ZIP**.
- To import into a sub-folder without opening it first, use that sub-folder's own options menu next to its name in the folder listing, then choose **Import ZIP**.

Then choose the ZIP file.

Large imports may take time. The dialog shows archive validation, conflict checking, and file-writing progress. The operation cannot be cancelled from the dialog; wait for a completed, conflict, partial, or error result before treating it as finished.

Mioframe validates and plans the complete archive before the mutation phase. If Mioframe detects a target conflict during preflight, the import stops before any mutation, lists the conflicting paths, and offers only **Close**. Existing matching folders may be reused without counting as a conflict.

Mioframe never intentionally overwrites, deletes, renames, or skips conflicting entries. Provider-specific filename rules or concurrent external filesystem changes may still cause an actual write to fail after the mutation phase begins. Such a failure is reported as a partial import rather than as a preflight conflict. An empty or different target folder remains the most predictable restore target.

Once the mutation phase has started, any provider failure — even during the first attempted write — stops the import immediately instead of continuing, retrying, or rolling back automatically. The summary reports confirmed imported files, created folders, and existing folders reused during preflight. The failed storage operation may still have changed the target even when no completed write was recorded. Importing the same archive into that target again is not safe; choose a new empty target folder to retry cleanly.

## Important limits

- Export JSON and Import JSON work on one document at a time as a content snapshot.
- Importing a JSON file always creates a new document; it does not restore the original document's storage identity, physical storage files, or edit history.
- Export ZIP and Import ZIP work at the storage level: raw files for a folder, or the physical storage files selected for one document. They are not a document content snapshot and cannot be opened as a normal document file.
- Import ZIP is file-level extraction, not Mioframe semantic validation. If storage chunks for the same Automerge document identity coexist, Automerge may combine available history when the repository opens.
- ZIP import enforces safety limits on entry count, planned files and folders, path length and depth, individual decompressed file size, and total decompressed size. Archives that exceed a limit are rejected before mutation.
- On browsers without direct file-system saving, Export ZIP falls back to a bounded in-memory archive of at most 200 MiB (about 210 MB); larger exports fail with an error on those browsers.
- ZIP export does not preserve filesystem permissions, timestamps, or symbolic links.
- Mioframe cannot recreate data that was never exported or otherwise preserved.

If import or recovery fails, see [Troubleshooting data problems](./03-data-troubleshooting.md).