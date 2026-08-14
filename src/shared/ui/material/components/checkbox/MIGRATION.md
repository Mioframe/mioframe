# Checkbox migration

Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
Revision summary: The corrected architecture requires no production change. Current consumer migration remains complete and the legacy Checkbox owner remains removed.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

Current canonical consumers:

1. `SettingsCheckboxListItem.vue` — decorative `presentation` composition.
2. `DatabaseViewsSheet.vue` — decorative `presentation` composition.
3. `RelationValueFieldData.vue` — standalone checked-only relation selection.
4. `MDCheckboxField.vue` — shared labeled tri-state field composition.
5. `BooleanValueInline.vue` — decorative read-only value display.
6. `MDListItemConsumerPatternsStory.vue` — Storybook-only fixture.

## Migrated consumers

All confirmed consumers already use canonical `MDCheckbox` directly or through `MDCheckboxField`. No consumer edit is required by the keyboard source-conflict correction.

## Preserved scenarios and failure paths

- `MDCheckboxField` retains shared field ownership, tri-state cycle, disabled behavior, label composition, accessible-name backstop, and autofocus composition.
- `BooleanValueInline` retains effective-value translation and does not confuse the domain indeterminate capability with actual rendered mixed state.
- settings and database-view rows retain decorative `presentation` ownership.
- relation selection retains its existing standalone checked-only behavior.

The domain translation remains:

```ts
checked = effectiveValue === true;
indeterminate = property.indeterminate === true && effectiveValue === undefined;
```

## Legacy ownership removed

The replaced `src/shared/ui/Checkbox/MDCheckbox.vue` owner, playground, stories, and replaced proof remain removed. No compatibility alias is restored.

## Source-conflict impact

The official Material cache's `Space or Enter` row is part of a keyboard table copied from Chips and is not accepted as Checkbox-specific behavior. This changes no consumer contract and requires no migration code.

## Stage verification

Existing consumer and family proof remains applicable. Exact-head GitHub CI is the PR repository gate.

## Remaining blockers

none

## Review readiness

ready
