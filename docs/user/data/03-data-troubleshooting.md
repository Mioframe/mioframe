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

## You have an exported JSON backup

If you have an exported JSON backup, use Mioframe's **Import JSON** action to restore that one document into an available location.

See [Backup and restore](./02-backup-and-restore.md) for the import steps.

## You do not have an exported JSON backup

If you do not have an exported JSON backup, recovery depends on whether another accessible copy still exists outside Browser Storage.

Next action:

- check your local folders, external drives, synced folders, or other places you may have saved a copy;
- check whether the document exists in a location you can still open directly.

If there is no remaining copy and the data was lost from Browser Storage or deleted outside Mioframe, Mioframe probably cannot recover it.
