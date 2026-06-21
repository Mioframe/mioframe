/**
 * Compact Material Expressive list constants used by browser assertions.
 *
 * Source notes:
 * - Current project-aligned cache summary: src/shared/ui/Lists/README.md
 * - Registry summary derived from the current m3-docs-cache List pages:
 *   docs/material-3/component-registry.md
 * - Audit notes for the same cache snapshot:
 *   docs/material-3/component-family-audit.md
 */
export const MD_LIST_MATERIAL_CONTRACT = {
  rowHeights: {
    oneLine: 56,
    twoLine: 72,
    threeLine: 88,
  },
  shapes: {
    default: 4,
    hover: 12,
    focused: 16,
    pressed: 16,
    dragged: 16,
    selected: 16,
    segmentedContainer: 16,
    media: 8,
  },
  segmentedGap: 2,
  leadingSizes: {
    avatar: 40,
    media: 56,
    icon: 20,
  },
  trailingIconSize: 20,
  minTrailingActionTarget: 48,
  contentSpacing: {
    block: 10,
    leading: 12,
    trailing: 16,
    trailingActionStart: 8,
  },
  stateLayerOpacity: {
    hover: '0.08',
    pressed: '0.1',
    dragged: '0.16',
  },
  focusIndicator: {
    thickness: '3px',
    offset: '2px',
  },
} as const;
