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

## How Mioframe stores documents

Current Mioframe storage normally uses Automerge storage files with the `.mf` extension. Spaces created by older versions may also contain legacy storage filenames that Mioframe still recognizes. A single document is typically represented by more than one physical storage file, not one file per document.

These files are internal storage for the whole Mioframe space in that folder, not standalone exported documents. Treat them as part of the folder's storage, not as something to move, copy, or share individually:

- Move or back up internal storage files only as part of moving or backing up the entire Mioframe space folder, or by using **Export ZIP** on that folder.
- Do not pick out a single `.mf` or legacy storage file expecting it to represent one document — use **Export ZIP** on the folder or the document instead, or open or move the whole folder.
- To get a single, portable, human-readable file for one document, use **Export JSON** instead of copying an internal storage file.
- To get a storage-level copy of a folder's file contents and directory structure, or of one document's physical storage files, use **Export ZIP** instead of copying individual internal files by hand.

ZIP export preserves file bytes, storage filenames, directory structure, and empty directories where applicable. It does not preserve filesystem permissions, timestamps, or symbolic links.

## Google Drive and other synced or shared folders

Google Drive may be available only when the integration is enabled, and the same applies to any folder that is itself synced or shared by another tool (a synced cloud folder, a shared local folder, and so on).

Access to that data is controlled by the storage provider or folder permissions (your Google Account, Drive sharing settings, or your operating system's folder permissions), not by Mioframe. Mioframe does not provide its own Share, Invite, participant management, or permissions management, and it has no separate collaboration mode. If a folder is shared with someone through the storage provider, that person gets the access the provider grants them — Mioframe is not aware of, and does not manage, who else can reach that folder.

## Backup expectations

Browser Storage should not be your only backup for important documents.

If you want a separate backup copy of a document's content, use Mioframe's document-level **Export JSON** action and keep the exported file somewhere you control. If you want a storage-level copy of a whole folder's file contents and directory structure, or of one document's physical storage files, use **Export ZIP** instead.

For practical backup and restore steps, see [Backup and restore](./02-backup-and-restore.md). For common failure scenarios, see [Troubleshooting data problems](./03-data-troubleshooting.md).