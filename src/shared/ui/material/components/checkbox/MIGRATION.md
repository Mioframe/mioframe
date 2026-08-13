# Checkbox migration

Status: blocked
IMPLEMENTATION.md reference: `src/shared/ui/material/components/checkbox/IMPLEMENTATION.md`
Revision summary: Current consumer migration remains structurally correct, but full PR review found an upstream Checkbox keyboard-contract defect. Official Material publishes Space or Enter activation while current architecture/implementation accept m3e's Space-only behavior. Migration must run fresh again after the upstream architecture/implementation correction.
Remaining blockers: Upstream architecture/implementation correction for Enter activation has not completed.
Required return family: self
Required return stage: architecture
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

After upstream correction, rerun migration fresh and confirm existing product/shared scenarios remain preserved.

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
checked = effectiveValue === true
indeterminate = property.indeterminate === true && effectiveValue === undefined
```

## Stage verification

Previous migration proof applied to the old upstream Space-only contract. After the Enter implementation correction, run the smallest verifier-managed consumer scopes selected by current architecture.

## Remaining blockers

Upstream Checkbox architecture/implementation correction and focused proof.

## Review readiness

Blocked. Route to `self/architecture`; after architecture and implementation are corrected, this migration stage must execute fresh before independent review.
