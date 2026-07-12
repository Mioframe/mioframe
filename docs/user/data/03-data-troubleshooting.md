# Troubleshooting data problems

This page explains common data access, import, and recovery problems in Mioframe and what to do next.

## Import failed because the file is not valid JSON

The selected file is probably not a JSON file, or it may be damaged or incomplete.

Next action:

- choose a different file if you selected the wrong one;
- if this file came from a backup, try another exported copy;
- if the file content is damaged and you do not have another backup, Mioframe probably cannot recover the document from this file.

## Import failed because the JSON file is not a Mioframe document

The file may be valid JSON but not a Mioframe document export.

Next action:

- confirm that the file came from Mioframe **Export JSON**;
- if you have the correct exported file, import that file instead;
- if you do not have a Mioframe document export, Mioframe probably cannot import or reconstruct the document from unrelated JSON.

## The selected file cannot be opened or read

The file may have been moved, deleted, locked by the system, or become unavailable before Mioframe could read it.

Next action:

- try selecting the file again;
- confirm that the file still exists and opens normally on your device;
- copy the file to a normal local folder and try the import again;
- if the file itself is unavailable or damaged and you do not have another copy, Mioframe probably cannot recover it.

## ZIP import failed because the archive is damaged or not a ZIP file

The selected file may not be a ZIP archive, or it may be damaged, incomplete, or use a ZIP structure that Mioframe cannot read.

Next action:

- choose a different file if you selected the wrong one;
- if this file came from a backup, try another exported copy;
- if the file content is damaged and you do not have another backup, Mioframe probably cannot recover the archive.

## ZIP import failed because the archive contains an unsafe file path

Mioframe rejects ZIP archives with entries that would write outside the target folder, for example paths starting with `/` or containing `..`. The import is rejected before mutation.

Next action:

- confirm that the archive came from Mioframe **Export ZIP**;
- if the archive was created or edited by another tool, inspect or recreate it with safe relative paths;
- Mioframe can import generic third-party ZIP files only when their paths and structure are safe and the archive stays within import safety limits.

## ZIP import failed because the archive exceeds a safety limit

Mioframe rejects an archive before mutation when it exceeds an import safety limit. Current limits include:

- 10,000 ZIP entries;
- 10,000 total planned files and folders after implied parent folders are included;
- 128 MiB for one decompressed file;
- 1 GiB total decompressed content;
- 1,024 characters for one relative path;
- 64 path segments of depth.

Next action:

- use a smaller archive or split the content into several archives;
- shorten excessively long or deeply nested paths;
- check for an unexpectedly large file or archive-bomb-like content;
- do not disable or work around the safety limits.

## ZIP import stopped because of a conflict with existing entries

When Mioframe detects an existing-file, existing-folder, or wrong-type conflict during preflight, the whole import stops before any mutation. Existing folders that match the archive's required folders are reused and are not reported as conflicts.

The conflict dialog lists a bounded set of conflicting paths and only offers **Close**.

Next action:

- import into an empty or different target folder when provider filename rules or the target contents make conflicts unclear.

Provider-specific filename equivalence or a concurrent external filesystem change may still cause an actual write to fail after preflight. That case is reported as a partial import, not as a preflight conflict.

## A ZIP import may be partial after writing starts

Once the mutation phase starts — including the first attempted file or folder creation — any provider failure stops Import ZIP immediately. Mioframe does not continue, roll back, resume, or retry the import automatically.

The summary reports confirmed imported files, created folders, and existing folders reused during preflight. A failed storage operation may still have changed the target even when the summary contains no completed write.

Next action:

- review the reported summary without treating it as a complete list of affected paths;
- start a new import into a new empty target folder to retry cleanly;
- do not import the same archive again into a folder that may already contain a partial import.

ZIP import works at the file level. It does not validate Mioframe document semantics. If restored storage chunks belong to the same Automerge document identity, Automerge may combine available history when the repository opens. External providers can apply different filename matching rules, so behavior is not globally atomic across providers.

## ZIP export or import stopped because earlier changes are still saving

Before ZIP export or import, Mioframe tries to finish pending saves for repositories that are already open in the app. If those saves are still blocked or have failed, the ZIP operation stops before reading export data or mutating the import target.

Next action:

- check the existing save-status indicator;
- if it shows **Save failed**, open it and choose **Grant write access** when that action is available;
- wait for saving to finish;
- then start a new ZIP export or import manually.

Mioframe does not automatically retry the ZIP operation after access is restored.

## Document ZIP export failed because no storage files were found

Export ZIP on a document stops before producing archive data when Mioframe cannot find physical storage files belonging to that document.

Next action:

- confirm that the document still opens normally;
- wait for any pending save to finish and try **Export ZIP** again;
- use **Export JSON** when you need a portable snapshot of the document's current content;
- if the document opens, saving is complete, and the error repeats, report the problem.

## ZIP export failed because the archive was too large for this browser

On browsers without direct file-system saving, Export ZIP builds the archive in memory before saving it, up to 200 MiB (about 210 MB). If the folder or document would produce a larger archive on that browser, the export stops with an error instead of continuing to consume memory.

Next action:

- try the export again in a browser with direct file-system saving support, such as a recent Chromium-based browser, where archive chunks can be streamed to the selected file without this fallback limit;
- export a smaller subset of the folder if you cannot switch browsers.

## A ZIP operation is taking a long time

Large folders, archives, and slow cloud-backed storage providers can make ZIP export or import take noticeable time.

Export progress shows preparing, reading, packing, and saving. Import progress shows archive validation, conflict checking, and writing. A running ZIP dialog cannot be cancelled or closed safely; wait for a completed, conflict, partial, or error result before treating the operation as finished.

## The document cannot be imported into the selected directory

The target directory may no longer be available, may require permission again, or may not accept the write operation.

Next action:

- reselect the target local folder if Mioframe asks for access again;
- choose another available directory;
- confirm that the folder still exists and that the browser can access it;
- if the original target location is gone, restore the folder outside Mioframe or import into a different location you control.

## A local folder asks for permission again

This can happen because browser-granted folder access is managed by the browser and may need to be granted again later.

Next action:

- grant access again if the folder is still the correct one;
- if the folder moved or changed, select the current folder location instead.

## A local folder, file, or document was moved, renamed, deleted, or damaged outside Mioframe

Mioframe may lose access to the original location or may no longer find the expected file.

Next action:

- restore the missing folder or file outside Mioframe if you can;
- reselect the folder if the browser needs access again;
- import a saved JSON snapshot or ZIP storage archive if you have one.

If the underlying files were deleted or damaged and you do not have another copy, Mioframe probably cannot recover the data.

## Browser Storage data disappeared

This can happen after clearing site data, deleting a browser profile, resetting the browser, changing browser, domain, or app storage context, or browser or device storage cleanup.

Next action:

- check whether you have an exported JSON snapshot or ZIP storage archive;
- check whether you also kept the document in a local folder or another storage location outside Browser Storage.

If the document existed only in Browser Storage and that storage was cleared or removed, Mioframe probably cannot recover it.

## You have an exported JSON or ZIP backup

If you have an exported JSON snapshot, use Mioframe's **Import JSON** action to create a new document from that snapshot in an available location.

If you have an exported ZIP storage archive of a folder, use **Import ZIP** on a new empty target folder to restore its file contents and directory structure. A document-level ZIP restores that document's physical storage files, not a JSON snapshot.

See [Backup and restore](./02-backup-and-restore.md) for the import steps and limitations.

## You do not have an exported JSON or ZIP backup

If you do not have an exported backup, recovery depends on whether another accessible copy still exists outside Browser Storage.

Next action:

- check your local folders, external drives, synced folders, or other places where you may have saved a copy;
- check whether the document exists in a location you can still open directly.

If there is no remaining copy and the data was lost from Browser Storage or deleted outside Mioframe, Mioframe probably cannot recover it.

## Where to get more help

If these steps do not resolve the problem, ask in [GitHub Discussions](https://github.com/Mioframe/mioframe/discussions) or report it in [GitHub Issues](https://github.com/Mioframe/mioframe/issues).
