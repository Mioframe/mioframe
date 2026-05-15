# Data storage and recovery

Mioframe is a local-first app. Mioframe does not store your documents on a Mioframe server.

## Where your data is stored

This page focuses on the local storage locations available in Mioframe:

- **Browser Storage**, which is storage managed by your browser for this app. Technically, this may be backed by browser-managed storage such as OPFS.
- **Local folders**, which are folders on your device that you explicitly choose through the app.

If you enable Google Drive integration, Mioframe can also work with files and folders available through your connected Google Drive account. Google Drive data remains subject to your Google Account and Google Drive settings.

## Browser Storage

Browser Storage is convenient, but it should not be treated as the only backup for important data.

Browser Storage can be affected by things outside Mioframe, including:

- deleting your browser profile;
- clearing site data or browser storage;
- removing or resetting the app or browser;
- browser storage pressure or cleanup by the browser or device;
- app, browser, or domain changes that make previous browser-managed data unavailable.

If your important documents exist only in Browser Storage, you may not be able to recover them after those kinds of changes.

## Local folders

Local folders are selected explicitly by you.

When you use a local folder, the browser requires permission to access that folder. Depending on your browser or device, you may be asked to grant folder access again later.

If files are deleted, moved, renamed, or damaged outside Mioframe, Mioframe may not be able to reopen or restore them.

## Backing up a document

Mioframe currently supports document-level export through the existing **Export JSON** action.

This exports a document as JSON. It is useful for keeping a backup copy of that document or moving it somewhere else.

This is not the same as a full workspace backup unless a future Mioframe version explicitly adds that feature.

## Restoring or importing a document

Mioframe currently supports restoring a document by importing JSON through the existing **Import JSON** action.

This imports a JSON document into a directory you choose in the app.

Restore/import is currently document-level. It should not be treated as a full workspace restore unless Mioframe explicitly says that a full-workspace restore feature exists.

## Questions and problems

If you have a question about storage or recovery, use GitHub Discussions:

[https://github.com/Vyachean/beaver/discussions](https://github.com/Vyachean/beaver/discussions)

If you found a bug or need to report a storage or data recovery problem, use GitHub Issues:

[https://github.com/Vyachean/beaver/issues](https://github.com/Vyachean/beaver/issues)