/**
 * Compact Material Expressive list constants used by browser assertions.
 *
 * Source notes:
 * - Primary source of truth: the `material3` MCP server (m3.material.io List
 *   component docs/specs — Lists Overview, Lists Specs, Lists Guidelines).
 *   Values below were checked against MCP `get_component_docs('list')`.
 * - Secondary local reference only (not a source of truth for Material
 *   values): src/shared/ui/Lists/README.md.
 *
 * List does not own the global keyboard focus indicator's Material tokens
 * (thickness/offset) — those belong to the existing global focus indicator
 * mechanism and must not be asserted here. See `md-list.spec.ts`'s
 * "keyboard focus indicator integration" suite for List's boundary-level
 * integration checks only.
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
  disabledOpacity: 0.38,
} as const;
