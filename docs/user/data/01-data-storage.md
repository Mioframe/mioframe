# Data storage

Mioframe is local-first. Mioframe does not store your documents on a Mioframe server.

## Where your data can be stored

See [Backup expectations](#backup-expectations) for why you should not rely on a single storage location.

Mioframe can work with data in a few different places:

- **Browser Storage** is storage managed by your browser for this app. Technically, this may use browser-managed storage such as OPFS.
- **Local folders** are folders on your device that you explicitly choose in Mioframe.
- **Google Drive** may be available when the Google Drive integration is enabled in your build and you choose to use it.

## Browser Storage

Browser Storage is convenient for quick access on the current browser profile, but it should not be treated as the only backup for important data.

Browser Storage is controlled by your browser and device environment. Data stored there can become unavailable if site data is cleared, a browser profile is deleted, the browser is reset, storage is cleaned up, or the app is used through a different browser, domain, or storage context.

Mioframe does not provide a server copy of Browser Storage data. If Browser Storage is cleared, Mioframe may not be able to restore documents that existed only there.

## Local folders

Local folders are chosen explicitly by you. Mioframe can use only folders that you select and grant access to through the browser.

Local folders can become unavailable if:

- permission is revoked or needs to be granted again;
- the folder is moved or renamed outside Mioframe;
- files inside the folder are moved, renamed, deleted, or damaged;
- the browser can no longer reach the previously granted folder location.

If that happens, Mioframe may no longer be able to open the affected files until access is granted again or the files are restored outside the app.

## Google Drive

Google Drive may be available only when the integration is enabled.

When you use Google Drive, the data remains subject to your Google Account and Google Drive settings, permissions, and availability.

## Backup expectations

Browser Storage should not be your only backup for important documents.

If you want a separate backup copy of a document, use Mioframe's document-level **Export JSON** action and keep the exported file somewhere you control.

For practical backup and restore steps, see [Backup and restore](./02-backup-and-restore.md). For common failure scenarios, see [Troubleshooting data problems](./03-data-troubleshooting.md).
