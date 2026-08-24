# Database virtualization dynamic surface-offset correction preflight

Status: **superseded by `docs/database-virtualization-deep-state-surface-offset-discriminator-preflight.md`**.

The production correction described by the previous preflight was implemented, but exact-head CI still reproduced the same desktop Chromium moving-surface failure. Do not use this file to authorize additional production edits.

Active next step:

1. strengthen the shared capability to reproduce `deep -> surfaceOffset change while still deep -> top -> deep` on the same root/list;
2. run focused verifier-managed Storybook behavior;
3. stop with evidence if the shared capability fails;
4. if it passes, return to the architect for a separate consumer-offset diagnostic task;
5. do not change Database/widget/shared production code in the discriminator pass.

See:

- `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`
- `docs/database-virtualization-deep-state-surface-offset-discriminator-preflight.md`
- `src/shared/ui/virtualization/REVIEW.md`
- `src/entities/databaseData/REVIEW.md`
