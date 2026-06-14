type ListItemAttrs = Record<string, unknown>;

const isRootOnlyAttr = (key: string): boolean =>
  key === 'class' || key === 'style' || key === 'id' || key.startsWith('data-');

/**
 * Splits forwarded attrs between the stable list item wrapper and the internal
 * primary action surface when the row renders one.
 * @param attrs
 * @param usesInternalActionSurface
 */
export const splitListItemAttrs = (
  attrs: ListItemAttrs,
  usesInternalActionSurface: boolean,
): {
  /** Attributes that stay on the outer list item wrapper. */
  rootAttrs: ListItemAttrs;
  /** Attributes that belong on the internal primary action surface. */
  interactiveAttrs: ListItemAttrs;
} => {
  if (!usesInternalActionSurface) {
    return {
      rootAttrs: attrs,
      interactiveAttrs: {},
    };
  }

  const rootEntries = Object.entries(attrs).filter(([key]) => isRootOnlyAttr(key));
  const interactiveEntries = Object.entries(attrs).filter(([key]) => !isRootOnlyAttr(key));

  return {
    rootAttrs: Object.fromEntries(rootEntries),
    interactiveAttrs: Object.fromEntries(interactiveEntries),
  };
};
