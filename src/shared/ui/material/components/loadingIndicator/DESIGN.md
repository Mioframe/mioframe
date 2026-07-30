# Loading indicator design

Status: current

Official component: Loading indicator  
Source snapshot date: 2026-07-20  
Source capture revision: Material MCP capture `2026-07-20T16:16:49.323Z`; token artifact `dsdb-resource:raw/dsdb/2026-07-01_06-10-02/designSystems_20543ce18892f7d9_components_68895be451a51c31.json`  
Design document date: 2026-07-30

## Official sources

| Route                                                               | Official title                  | Coverage                                       |
| ------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| `https://m3.material.io/components/loading-indicator/overview`      | Loading indicator Overview      | Cached page inspected                          |
| `https://m3.material.io/components/loading-indicator/specs`         | Loading indicator Specs         | Cached page and resolved token table inspected |
| `https://m3.material.io/components/loading-indicator/guidelines`    | Loading indicator Guidelines    | Cached page inspected                          |
| `https://m3.material.io/components/loading-indicator/accessibility` | Loading indicator Accessibility | Cached page inspected                          |

The newest successfully acquired official snapshot contains all four official tabs and reports no unresolved token rows or missing component resources. A refresh attempted on 2026-07-30 failed because `site_meta.js` did not provide a usable route list, but no newer source revision or changed official content was discovered. Under the repository source lifecycle, the failed helper is recorded as a tooling limitation and does not invalidate this complete snapshot.

## Identity and purpose

Loading indicators communicate a short, ongoing process whose progress is indeterminate. They use a looping sequence of shape morphs to attract attention, reduce perceived latency, and show that activity is still in progress. They are never merely decorative.

The component was added with M3 Expressive in May 2025; no pre-Expressive M3 loading-indicator variant is defined. Material recommends it for short processes between 200 ms and 5 s and as the replacement for most uses of the indeterminate circular progress indicator. It is also the indicator specified for pull-to-refresh.

Loading indicators are distinct from progress indicators:

| Expected wait      | Official recommendation                            |
| ------------------ | -------------------------------------------------- |
| Under 200 ms       | Show the result directly; do not show an indicator |
| 200 ms through 5 s | Use a loading indicator                            |
| Over 5 s           | Use a progress indicator                           |

When a process may change from indeterminate to determinate, use an indeterminate progress indicator and transition it to its determinate counterpart. Do not transition a loading indicator into a determinate progress indicator. For very long activity, consider allowing navigation away while work continues.

Official availability at the snapshot is: Material 3 Design Kit available, Jetpack Compose Expressive available, Android Views Expressive available, and Web Expressive unavailable.

Sources: Overview; Guidelines, Usage.

## Variants and configurations

There is one M3 Expressive variant, **Loading indicator**, with two containment configurations:

| Configuration         | Description                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default (uncontained) | The active indicator appears without a visible container and uses the primary color role. Use directly on a suitable surface.                                                                                                                      |
| Contained             | The active indicator appears within a circular container. Use when placed over other content to increase contrast and for pull-to-refresh. The active indicator changes to the on-primary-container role and the container uses primary-container. |

The component is indeterminate. The official pages publish no determinate mode, label text part, selection mode, disabled state, interactive state layer, elevation variant, density variant, or alternate shape configuration.

Sources: Overview; Specs, Variants and Configurations; Guidelines, Anatomy.

## Anatomy

1. **Active indicator** — required. A continuously looping morph sequence composed of seven unique Material 3 shapes.
2. **Container** — optional. A circular background that supplies additional separation from underlying content.

The active indicator is the progress-bearing visual. When the optional container is visible, the active indicator changes from primary to on-primary-container. The component has no label rendered as part of its visual anatomy; its accessible label is semantic.

Sources: Specs, Anatomy; Guidelines, Anatomy.

## Color

The default active indicator uses `md.sys.color.primary`. For the contained configuration, the active indicator uses `md.sys.color.on-primary-container` and the visible container uses `md.sys.color.primary-container`.

The specs token table also publishes a general `container.color` mapped to `md.sys.color.secondary-container`, although the prose and contained illustration identify primary-container for the visible contained configuration. This conflict is preserved under [Source conflicts and unknowns](#source-conflicts-and-unknowns).

The active indicator must have at least 3:1 contrast against the background it is perceived on. The container itself is not required to have 3:1 contrast. When the loading indicator is composed inside another component, the active indicator must retain at least 3:1 contrast against that component.

Sources: Specs, Color; Accessibility, Interaction & style.

## Geometry and responsive layout

| Measurement                      | Official value                        |
| -------------------------------- | ------------------------------------- |
| Default overall/container width  | 48 dp                                 |
| Default overall/container height | 48 dp                                 |
| Default active-indicator size    | 38 dp                                 |
| Permitted overall size range     | 24–240 dp                             |
| Container shape                  | Circular / `md.sys.shape.corner.full` |

The 48 dp overall size supplies margin around the 38 dp morphing shape. When resized, the active-indicator-to-container ratio remains constant. The default size is intended for mobile and compact windows. As pane or window size grows, the indicator may scale with the surrounding empty space; very large indicators are reserved for large and extra-large windows and must not exceed 240 dp. Do not go below 24 dp.

Sources: Specs, Measurements; Guidelines, Responsive layout.

## Placement and composition

- Center the indicator within a page or container whose contents are loading.
- When adding content to a surface that already contains items, center the indicator in the empty area where new content will appear; do not overlap existing content.
- The indicator may be placed within components such as buttons for actions that take a few seconds, including form validation or update checks.
- It may occupy a compact location such as a tab icon.
- Show the circular container when the indicator overlays other content; a container is unnecessary when the indicator sits directly on a suitable surface.

Sources: Guidelines, Placement and Anatomy.

## Behavior and motion

The active indicator continuously morphs through seven Material 3 shapes in a loop. The official component pages define the sequence conceptually but publish no per-shape names, keyframe timing, easing, spring parameters, rotation values, or total loop duration.

The indicator remains visible while the represented process is ongoing. For pull-to-refresh, it remains visible until refresh completes and new content is visible, or until the user navigates away.

### Pull-to-refresh

The documented pull-to-refresh behavior is identified as Jetpack Compose only. It applies at the start of lists, grids, and card collections whose newest content appears first and is most appropriate for frequently changing content where refresh is likely to reveal something new.

- A drag must cross an intentional threshold before release initiates refresh.
- Reversing the gesture back past the threshold cancels refresh.
- The indicator may appear over or adjacent to content.
- Keep it visible and on-screen for the whole refresh activity; scrolling it away hides status and can falsely associate the refresh with a particular item rather than the whole screen.
- Gesture-only refresh is inaccessible. Provide an alternative single-pointer action, such as a refresh button in an app bar, menu, or beside the content.

Sources: Guidelines, Behavior; Accessibility, Use cases and Interaction & style.

## Usage guidance

Use a loading indicator when progress cannot be detected or remaining time need not be communicated, particularly for background work expected to take 200 ms to 5 s. Its motion should communicate real ongoing activity.

Do not:

- show one for work that completes in under 200 ms;
- use one for activity expected to exceed 5 s when a progress indicator is appropriate;
- use one for a process that will transition from indeterminate to determinate;
- present one as decoration unrelated to an active process;
- overlap existing loaded content when space for incoming content is available;
- exceed the 24–240 dp range;
- let a pull-to-refresh indicator scroll out of view while refresh continues;
- depend on a swipe gesture as the only refresh mechanism.

Sources: Overview; Guidelines; Accessibility.

## Accessibility

Assistive-technology users must be able to navigate to the loading indicator, understand which progress it communicates, and initiate refresh without relying on a gesture.

- Use the **progress bar** accessibility role.
- Supply an accessible label that identifies what is loading or refreshing, for example “loading news article” or “refreshing page.”
- Maintain at least 3:1 contrast between the active indicator and its perceived background, including when composed into another component.
- The container itself has no 3:1 contrast requirement.
- Provide a single-pointer alternative for pull-to-refresh.

The official page does not publish component-specific keyboard commands, focus-ring geometry, live-region behavior, value attributes, determinate range semantics, reduced-motion behavior, or announcement cadence.

Source: Accessibility.

## Complete official component-token catalogue

Blank values mean the official token table publishes no value for that mode. Values below preserve the resolved Material MCP token resource; aliases are separated into system and reference aliases.

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

Source: Specs, Tokens & specs; resolved token resource `designSystems/20543ce18892f7d9/components/68895be451a51c31`.

## Source conflicts and unknowns

1. **Refresh limitation.** The complete cached pages were captured on 2026-07-20. The 2026-07-30 refresh helper failed before route discovery because `site_meta.js` did not provide a usable route list. No newer source revision or changed official content was found, so this is recorded as a tooling limitation rather than stale design evidence.
2. **Swapped size display names.** The official token resource assigns the display name “Loading indicator container width” to `active-indicator.size` (38 dp) and “Loading indicator active indicator size” to `container.width` (48 dp). The paths, numeric values, measurement prose, and illustration establish the opposite semantic relationship. The catalogue preserves the official display names verbatim rather than silently correcting them.
3. **Container color conflict.** The contained-configuration prose and illustration specify primary-container, matching `contained.container.color`. The same token set additionally publishes a general `container.color` using secondary-container without explaining which configuration consumes it.
4. **Dark high-contrast serialization.** The cached Markdown table serializes the dark high-contrast contained active-indicator value as `{"alpha":1}`. The resolved token resource reports `#000000`; the catalogue uses that resolved value and records this extraction discrepancy here.
5. **Unspecified motion values.** The component pages state that seven Material shapes morph in a loop but do not publish the shape names or exact motion parameters.
6. **Unpublished modes.** High-contrast geometry/shape values and several component-specific behavioral/accessibility mechanics are absent from the official tables and prose; they are not inferred.

## Related official contracts

- **Progress indicators** are the alternative for waits over 5 s and own the indeterminate-to-determinate transition pattern.
- **Material shape library** supplies the seven shapes used by the morph sequence, but the component page does not enumerate them.
- **Buttons and tabs** are documented composition contexts; the loading indicator remains the progress-bearing visual within them.
- **Pull-to-refresh** supplies the gesture, threshold, cancellation, and refresh lifecycle described by the component guidance and is documented as Jetpack Compose only.

No additional component token set or delegated measurement table is linked by the cached official component pages.