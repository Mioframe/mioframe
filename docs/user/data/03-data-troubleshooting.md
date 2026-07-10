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

The selected file may not be a ZIP archive, or it may be damaged or incomplete.

Next action:

- choose a different file if you selected the wrong one;
- if this file came from a backup, try another exported copy;
- if the file content is damaged and you do not have another backup, Mioframe probably cannot recover the archive.

## ZIP import failed because the archive contains an unsafe file path

Mioframe rejects ZIP archives with entries that would write outside the target folder (for example, paths starting with `/` or containing `..`). Nothing is written when this happens.

Next action:

- confirm that the archive came from Mioframe **Export ZIP**;
- if the archive was created or edited by another tool, it may not be a Mioframe-compatible archive — Mioframe cannot import arbitrary third-party ZIP files that use unsafe paths.

## ZIP import stopped because of a conflict with existing files

Import ZIP reports ordinary existing-file and wrong-type conflicts before writing. This is expected: Mioframe does not overwrite, delete, or rename existing files during ZIP import.

Next action:

- choose **Abort** to leave the target unchanged;
- choose **Skip existing** to leave existing files unchanged and import only non-conflicting files; matching folders are reused;
- import into an empty folder when provider filename rules or the target contents make conflicts unclear.

## A ZIP import stopped partway through with some files written

If the browser loses folder access or another provider operation fails after writing starts, Import ZIP may leave one attempted entry in an uncertain state. Mioframe does not roll back completed files and does not assume that the uncertain file is safe to skip.

Next action:

- grant folder access again if the browser asks for it;
- choose **Verify and continue**. Mioframe checks an existing uncertain file byte-for-byte against its archive entry before any new write. A matching file is verified; a missing file is created normally; a matching directory is reused;
- if the uncertain file differs or has the wrong type, Mioframe stops recovery without overwriting or deleting it. Import the archive into an empty folder as the safe fallback.

ZIP import works at the file level. It does not validate Mioframe document semantics. If restored storage chunks belong to the same Automerge document identity, Automerge may combine the available history when the repository opens. External providers can also apply different filename matching rules, so behavior is not globally atomic across providers.

## ZIP export failed because the archive was too large for this browser

On browsers without file-system access support, Export ZIP builds the archive in memory before saving it, up to a bounded size. If the folder or document you are exporting would produce a larger archive than that on this browser, the export stops with an error instead of running out of memory.

Next action:

- try the export again in a browser with file-system access support (for example, a recent Chromium-based browser), where exports stream directly to disk without this limit;
- export a smaller subset of the folder if you cannot switch browsers.

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
- import a saved JSON backup if you have one.

If the underlying files were deleted or damaged and you do not have another copy, Mioframe probably cannot recover the data.

## Browser Storage data disappeared

This can happen after clearing site data, deleting a browser profile, resetting the browser, changing browser, domain, or app storage context, or browser or device storage cleanup.

Next action:

- check whether you have an exported JSON backup of the document;
- check whether you also kept the document in a local folder or another storage location outside Browser Storage.

If the document existed only in Browser Storage and that storage was cleared or removed, Mioframe probably cannot recover it.

## You have an exported JSON or ZIP backup

If you have an exported JSON backup, use Mioframe's **Import JSON** action to restore that one document into an available location.

If you have an exported ZIP backup of a folder, use **Import ZIP** on an empty target folder to restore its raw storage files.

See [Backup and restore](./02-backup-and-restore.md) for the import steps.

## You do not have an exported JSON or ZIP backup

If you do not have an exported backup, recovery depends on whether another accessible copy still exists outside Browser Storage.

Next action:

- check your local folders, external drives, synced folders, or other places you may have saved a copy;
- check whether the document exists in a location you can still open directly.

If there is no remaining copy and the data was lost from Browser Storage or deleted outside Mioframe, Mioframe probably cannot recover it.

## Where to get more help

If these steps do not resolve the problem, ask in [GitHub Discussions](https://github.com/Mioframe/mioframe/discussions) or report it in [GitHub Issues](https://github.com/Mioframe/mioframe/issues).
