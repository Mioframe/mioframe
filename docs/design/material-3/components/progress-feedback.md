# Progress and feedback

Progress indicators explain that work is happening. They must reduce uncertainty without hiding the current app state.

## Progress indicators

Use progress indicators when an operation takes long enough that the user may wonder whether the app is still working.

Project rules:

- Use determinate progress when the app can honestly report progress.
- Use indeterminate progress only when the duration or amount of work is unknown.
- Do not block the whole UI for local work unless continuing would be unsafe.
- Keep progress close to the affected surface when possible.
- Use full-screen loading only for initial app boot or missing critical data.
- Avoid multiple competing spinners.
- Use progress text when the operation has meaningful stages.

Existing component:

- `src/shared/ui/ProgressIndicators/MDCircularProgressIndicator.vue`

## Feedback copy

Feedback should tell the user what changed or what is still happening.

Project rules:

- Avoid generic text such as `Loading...` when the operation is specific.
- Error feedback should identify the failing operation and recovery path.
- Success feedback should be short and should not interrupt repeated data entry.
- Long diagnostics belong in expandable details, not primary UI.

## Review checklist

- Is the progress indicator attached to the correct scope?
- Is determinate progress used when available?
- Can the user continue safely while the operation runs?
- Does copy explain the operation without technical noise?
- Are loading, empty, error, and success states distinct?
