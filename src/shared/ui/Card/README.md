# Card Contract

- `MDCard` is a Material 3 card container: `elevated`, `filled`, or `outlined` (`variant`, default `filled`).
- `mode` picks one of the two Material-documented interaction shapes, never both at once:
  - `static` (default): a non-actionable container. No role, no tabindex, no hover state layer, no ripple. Internal buttons/links are allowed and own their own actions.
  - `button` / `link`: a directly actionable card surface. The whole card is the native `button`/`a[href]`, with `MDStateLayer` + ripple for hover/focus/pressed/dragged, and an `action` emit.
- Material's accessibility guidance explicitly avoids stacking actionable surfaces: an actionable card (`mode="button"`/`"link"`) must not contain its own nested buttons or links. MDCard does not enforce this with a DOM scan of the default slot (the slot renders arbitrary consumer content, so a reliable scan is not a narrow, low-risk check) — treat it as an unsupported combination, not a documented pattern.
- `disabled` only has meaning for actionable modes. A disabled `button` card uses native `disabled`. A disabled `link` card keeps `href` semantics off via `aria-disabled="true"` + `tabindex="-1"` and blocks the click handler in script, since links ignore the native `disabled` attribute.
- `dragged` is an externally controlled prop (e.g. driven by a sortable/reorder consumer), not native HTML drag detection.
