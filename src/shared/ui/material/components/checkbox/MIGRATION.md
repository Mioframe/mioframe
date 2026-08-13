# Checkbox migration

Status: blocked
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
Revision summary: Current consumer migration remains structurally correct, but corrected Checkbox architecture now requires Enter activation that current implementation does not yet provide. Migration must run fresh again after the implementation/proof correction.
Remaining blockers: Upstream implementation correction for Enter activation has not completed.
Required return family: self
Required return stage: implementation
Review readiness: blocked

## Consumer inventory

Current canonical consumers remain:

1. `SettingsCheckboxListItem.vue` — decorative `presentation` composition.
2. `DatabaseViewsSheet.vue` — decorative `presentation` composition.
3. `RelationValueFieldData.vue` — standalone checked-only relation selection.
4. `MDCheckboxField.vue` — shared labeled tri-state field composition.
5. `BooleanValueInline.vue` — decorative read-only value display.
6. `MDListItemConsumerPatternsStory.vue` — Storybook-only fixture.

## Migrated consumers

No consumer-specific migration defect is currently known. Current source already uses canonical `MDCheckbox` and the replaced legacy owner remains removed.

## Preserved scenarios and failure paths

The Enter correction belongs to the canonical Checkbox family. No consumer edit is expected solely because the canonical control gains the missing official keyboard activation.

After implementation correction, rerun migration fresh and confirm existing product/shared scenarios remain preserved.

## Legacy ownership removed

The replaced legacy `src/shared/ui/Checkbox/MDCheckbox.vue` owner, playground, stories, and replaced proof remain removed. No compatibility alias should be restored.

## Consumer and blast-radius proof

Fresh post-correction migration must recheck:

- `MDCheckboxField` tri-state cycle, disabled behavior, label click, accessible-name backstop, and autofocus composition;
- `BooleanValueInline` effective-value translation including default and indeterminate-capability boundaries;
- decorative presentation ownership in settings and database-view rows;
- standalone relation-selection behavior;
- absence of legacy direct consumers.

The domain translation remains:

```ts
checked = effectiveValue === true;
indeterminate = property.indeterminate === true && effectiveValue === undefined;
```

## Stage verification

Previous migration proof applied to the old Space-only implementation. After the Enter correction, run the smallest verifier-managed consumer scopes selected by current architecture.

## Remaining blockers

Upstream Checkbox implementation/proof correction.

## Review readiness

Blocked. Route to `self/implementation`; after implementation is corrected, this migration stage must execute fresh before independent review.
