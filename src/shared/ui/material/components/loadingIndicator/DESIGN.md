# Loading indicator design

Artifact revision: 2026-08-01T11:48:39.122Z
Design contract revision: 2026-08-01T09:59:39.918Z
Status: current
Source revision: Material MCP capture `2026-07-20T16:16:49.323Z`; token resource `designSystems/20543ce18892f7d9/components/68895be451a51c31`
Source checked at: 2026-08-01
Refresh check after: 2026-08-31
Revision summary: Reformatted the complete official contract without changing normalized Material content.
Remaining blockers: none
Required return family: none
Required return stage: none

## Source ledger

| Official route                                                      | Official title                  | Snapshot and coverage                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `https://m3.material.io/components/loading-indicator/overview`      | Loading indicator Overview      | Captured 2026-07-20; identity, availability, and Expressive update represented                                              |
| `https://m3.material.io/components/loading-indicator/specs`         | Loading indicator Specs         | Captured 2026-07-20; variants, configurations, anatomy, colors, measurements, and complete resolved token table represented |
| `https://m3.material.io/components/loading-indicator/guidelines`    | Loading indicator Guidelines    | Captured 2026-07-20; usage, anatomy, placement, responsive layout, and pull-to-refresh behavior represented                 |
| `https://m3.material.io/components/loading-indicator/accessibility` | Loading indicator Accessibility | Captured 2026-07-20; assistive-technology use cases, contrast, alternate refresh action, role, and labeling represented     |

The route index identifies these four tabs as the complete component route set. The cache reports verified coverage, no failed accepted routes, no unresolved component resources, and zero unresolved token rows for this family. An explicit refresh on 2026-08-01 failed during `site_meta.js` route discovery and left the prior cache unchanged. Direct checks of all four official URLs on 2026-08-01 reached the current Material site but exposed only its JavaScript application shell. No newer official component revision or contradictory current content was acquired, so the newest complete official snapshot remains the selected fallback.

## Identity and purpose

Loading indicators communicate a short, ongoing process whose progress is indeterminate. Their looping shape motion attracts attention, mitigates perceived latency, and communicates that activity is in progress; they are never decorative.

The component was added to the catalog with M3 Expressive in May 2025. No pre-Expressive M3 loading-indicator variant is defined. Material recommends it for short processes between 200 ms and 5 s, replacing most uses of the indeterminate circular progress indicator, and specifies it for pull-to-refresh.

Loading indicators differ from progress indicators by wait duration and transition capability. For work under 200 ms, show content without an indicator. For work from 200 ms through 5 s, use a loading indicator. For work over 5 s, use a progress indicator. If an indeterminate process can become determinate, use an indeterminate progress indicator and transition to its determinate counterpart; do not transition a loading indicator into a determinate progress indicator. For very long work, consider allowing navigation away while processing continues.

At the selected snapshot, the Material 3 Design Kit, Jetpack Compose Expressive, and Android Views Expressive resources are available; Web Expressive is listed as unavailable.

## Anatomy and content

1. **Active indicator — required.** The progress-bearing visual continuously loops through a morph sequence composed of seven unique Material 3 shapes.
2. **Container — optional.** A circular background provides separation and contrast against underlying content.

The component has no visible label or supporting-content part. Its required descriptive label is semantic. When the optional container is visible, the active indicator changes from the primary color role to on-primary-container.

## Variants and configurations

There is one M3 Expressive variant, **Loading indicator**, with two containment configurations:

| Configuration         | Official contract                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default (uncontained) | Required active indicator without a visible container; the active indicator uses the primary color role and sits directly on a suitable surface.                                                                          |
| Contained             | Required active indicator within the optional circular container; use over other content for stronger contrast and for pull-to-refresh. The indicator uses on-primary-container and the container uses primary-container. |

The component is indeterminate. The official component pages publish no determinate configuration, rendered label, selection mode, disabled state, interactive state layer, elevation variant, density variant, or alternate container shape. The default overall size is 48 dp and the supported responsive range is 24–240 dp.

## Geometry and layout

| Measurement                      | Official value                       |
| -------------------------------- | ------------------------------------ |
| Default overall/container width  | 48 dp                                |
| Default overall/container height | 48 dp                                |
| Default active-indicator size    | 38 dp                                |
| Supported overall size range     | 24–240 dp                            |
| Container shape                  | Circular; `md.sys.shape.corner.full` |

The 48 dp overall size provides margin around the 38 dp morphing shape. When the component is resized, the ratio between the container and active indicator remains constant. The default size is intended for mobile and compact windows. As pane or window size grows, the indicator may scale in proportion to the surrounding empty space; reserve very large indicators for large and extra-large windows and never exceed 240 dp or go below 24 dp.

Center the indicator within a page or container whose contents are loading. When loading additional items into an existing surface, center it in the empty area where incoming content will appear and do not overlap existing content. A loading indicator may be composed inside another component, including as a button's loading visual or a tab icon. Show the circular container when the indicator overlays content; it is unnecessary when the indicator sits directly on a suitable surface.

## States and behavior

The documented visual state is active indeterminate loading. The active indicator continuously morphs through seven Material shapes in a loop and remains visible while the represented process is ongoing. The component pages do not publish the individual shape names, keyframe timing, easing, spring parameters, rotation values, or total loop duration.

For pull-to-refresh, documented as Jetpack Compose only, the component applies at the beginning of lists, grids, and card collections where the newest content appears first. It is best suited to frequently updated content where refreshing is likely to reveal new content.

- A drag must cross an intentional threshold before release initiates refresh.
- Reversing the gesture back past the threshold cancels refresh.
- The indicator may appear over or adjacent to content.
- It remains visible until refresh completes and new content is visible, or until the user navigates away.
- It must stay on-screen during refresh; scrolling it away hides status and can falsely associate the activity with one item rather than the whole screen.

The official pages define no activation, selection, hover, pressed, focused, disabled, error, success, determinate, or restoration state for the component itself.

## Usage guidance

Use a loading indicator when progress cannot be detected or remaining time does not need to be communicated, particularly for background activity expected to last 200 ms to 5 s. Its motion must correspond to real ongoing activity.

Do not:

- show one for work that completes in under 200 ms;
- use one for activity expected to exceed 5 s when a progress indicator is appropriate;
- use one for a process that will transition from indeterminate to determinate;
- use one decoratively or without an ongoing process;
- overlap existing content when empty space for incoming content is available;
- size it outside 24–240 dp;
- let a pull-to-refresh indicator scroll out of view while refresh continues;
- depend on a swipe gesture as the only refresh mechanism.

Use the contained configuration when the component overlays content and for pull-to-refresh. Use the uncontained configuration directly on a surface with adequate contrast. For long-running processes, prefer a progress indicator and consider letting users navigate away.

## Accessibility

Assistive-technology users must be able to navigate to the loading indicator, understand what progress it communicates, and initiate a content refresh without relying on a gesture.

- Use the **progress bar** accessibility role.
- Provide an accessible label that names what is loading or refreshing, such as “loading news article” or “refreshing page.”
- Maintain at least 3:1 contrast between the active indicator and its perceived background, including when composed inside another component.
- The optional container itself is not required to meet 3:1 contrast against its background.
- Because swipe-only pull-to-refresh is inaccessible, provide a single-pointer alternative such as a refresh action in an app bar, menu, or alongside the content.

The official component page does not publish component-specific keyboard commands, focus-ring geometry, live-region behavior, range/value attributes, determinate semantics, reduced-motion behavior, or announcement cadence.

## Complete official token catalogue

The official specs publish one token set, `md.comp.loading-indicator`. An em dash means the official resolved table supplies no alias or value for that field.

| Official token path                                          | Official display name                              | System alias                        | Reference alias              | Light                   | Dark                    | Light high contrast | Dark high contrast |
| ------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------- | ---------------------------- | ----------------------- | ----------------------- | ------------------- | ------------------ |
| `md.comp.loading-indicator.active-indicator.color`           | Loading indicator active indicator color           | `md.sys.color.primary`              | `md.ref.palette.primary40`   | `#6750a4`               | `#d0bcff`               | `#381e72`           | `#f6edff`          |
| `md.comp.loading-indicator.active-indicator.size`            | Loading indicator container width                  | —                                   | —                            | `38dp`                  | `38dp`                  | —                   | —                  |
| `md.comp.loading-indicator.container.height`                 | Loading indicator container height                 | —                                   | —                            | `48dp`                  | `48dp`                  | —                   | —                  |
| `md.comp.loading-indicator.container.width`                  | Loading indicator active indicator size            | —                                   | —                            | `48dp`                  | `48dp`                  | —                   | —                  |
| `md.comp.loading-indicator.container.shape`                  | Loading indicator container shape                  | `md.sys.shape.corner.full`          | —                            | `SHAPE_FAMILY_CIRCULAR` | `SHAPE_FAMILY_CIRCULAR` | —                   | —                  |
| `md.comp.loading-indicator.contained.container.color`        | Loading indicator contained container color        | `md.sys.color.primary-container`    | `md.ref.palette.primary90`   | `#eaddff`               | `#4f378b`               | `#4f378b`           | `#d0bcff`          |
| `md.comp.loading-indicator.contained.active-indicator.color` | Loading indicator contained active indicator color | `md.sys.color.on-primary-container` | `md.ref.palette.primary30`   | `#4f378b`               | `#eaddff`               | `#ffffff`           | `#000000`          |
| `md.comp.loading-indicator.container.color`                  | Loading indicator container color                  | `md.sys.color.secondary-container`  | `md.ref.palette.secondary90` | `#e8def8`               | `#4a4458`               | `#4a4458`           | `#ccc2dc`          |

## Source conflicts and unknowns

1. **Current-source refresh limitation.** The complete snapshot was captured on 2026-07-20. The 2026-08-01 refresh failed before route discovery because `site_meta.js` could not be fetched or parsed into a usable route list; direct route checks returned only the JavaScript application shell. No newer revision was acquired, and the complete prior snapshot remains the newest available official contract.
2. **Swapped size display names.** The official token resource assigns “Loading indicator container width” to `active-indicator.size` at 38 dp and “Loading indicator active indicator size” to `container.width` at 48 dp. The token paths, values, measurement prose, and illustration imply the opposite semantic relationship. The catalogue preserves the official display names without silently correcting them.
3. **Container-color ambiguity.** Contained-configuration prose and imagery specify primary-container, matching `contained.container.color`. The same token set also publishes a general `container.color` mapped to secondary-container without explaining which configuration consumes it.
4. **Dark high-contrast serialization discrepancy.** The cached Markdown token table serializes the contained active-indicator value as `{"alpha":1}`. The resolved token resource reports `#000000`; the catalogue records the resolved value.
5. **Unspecified motion detail.** The pages state that seven Material shapes morph in a loop but do not name the shapes or provide exact motion values.
6. **Unpublished mechanics.** High-contrast geometry and shape values, precise adaptive sizing rules within the 24–240 dp range, and several component-specific accessibility mechanics are not published and are not inferred.

## Related official contracts

- **Progress indicators** are the alternative for waits over 5 s and own the indeterminate-to-determinate transition pattern.
- **Material shape library** supplies the seven shapes used by the morph sequence, though the component page does not enumerate them.
- **Buttons and tabs** are documented composition contexts; the loading indicator remains the progress-bearing visual within them.
- **Pull-to-refresh** supplies the gesture, threshold, cancellation, and refresh lifecycle described by the component guidance and is documented for Jetpack Compose only.

No additional component token set or delegated measurement table is linked by the official component pages.
