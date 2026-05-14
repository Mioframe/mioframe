# Privacy Policy

Applies to Mioframe 0.1  
Last updated: 2026-05-14

Mioframe is a local-first app for working with your own documents and records. This policy explains where your data is stored and how optional error diagnostics work.

## No Mioframe account

You can use Mioframe without creating a Mioframe account.

Mioframe does not provide a hosted backend for storing your documents. Your documents are not stored on a Mioframe server.

## Where your data is stored

Your documents and records are stored in places you control:

- in browser storage used by your browser for this app;
- or in local folders that you explicitly choose through the app.

## Document contents

Mioframe does not send document contents, record values, document names, folder names, local folder paths, document ids, or file ids to the developer.

## Google Drive

Google Drive integration is optional.

Mioframe uses Google Drive only after you enable the integration in Settings and connect a Google account. When enabled, Mioframe can show and work with files and folders available through the connected Google Drive account according to the permissions granted during Google sign-in.

### Google account and session data stored locally

When you connect Google Drive, Mioframe stores the following Google account and session data locally in browser storage:

- Google account email;
- optional profile name;
- optional profile picture;
- granted Google scopes;
- access token;
- token expiration time.

Mioframe uses this data only to keep the Google Drive integration working and to make Google Drive API requests on your behalf.

These Google account and session details are not sent to the developer.

Google Drive access is used to provide file-manager behavior inside Mioframe. Depending on the permissions you grant and the actions you take in the app, Mioframe can list, read, download, create, upload, rename, move, and trash files and folders in your Google Drive.

Turning off Google Drive in Mioframe Settings disables the integration inside Mioframe. It does not revoke Mioframe's access from your Google Account.

Google Drive data remains subject to your Google Account and Google Drive settings.

## Error diagnostics

Error diagnostics are optional and disabled until you allow them.

If you enable error diagnostics, Mioframe can send technical error reports to Sentry when an error happens. These reports help investigate crashes and unexpected failures.

You can enable or disable error diagnostics at any time in Settings under **Error diagnostics**.

Diagnostic reports should not contain:

- document contents;
- record values;
- document names;
- folder names;
- local folder paths;
- document ids;
- file ids.

Diagnostic reports may contain technical information needed to debug an error, such as:

- stack traces;
- app version or build information;
- error type or error code;
- a safe application error message.

## Session Replay

Mioframe 0.1 does not use Sentry Session Replay. Error diagnostics do not record your screen or app session.

## Questions

For questions about privacy, open a GitHub Discussion:

[https://github.com/Vyachean/beaver/discussions](https://github.com/Vyachean/beaver/discussions)

To report a privacy-related bug or data handling issue, open a GitHub Issue:

[https://github.com/Vyachean/beaver/issues](https://github.com/Vyachean/beaver/issues)
