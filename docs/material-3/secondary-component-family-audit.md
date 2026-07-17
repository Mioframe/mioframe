# Historical secondary component-family audit

This file is retained only as a pointer to a pre-library review snapshot. The previous detailed contents remain available in repository history.

It does not own current implementation or compliance state.

When a component family enters migration:

1. resolve its official Material documentation slug;
2. create `src/shared/ui/material/components/<slug>/README.md` with implemented, unsupported, incomplete, and unverified state;
3. implement or migrate the family;
4. run `material-component-review <family>` to create the colocated `AUDIT.md`.

Until then, the compact [component registry](./component-registry.md) and [shared UI inventory](./ui-library-inventory.md) provide high-level program classification.

Do not add new findings to this historical file.