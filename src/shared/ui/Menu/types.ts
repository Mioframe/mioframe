/** Minimal shape required to render a menu button. */
export interface BaseMenuButton {
  /** Visible button text. */
  label: string;
  /** Stable identifier reported on selection. */
  key: string | number;
  /** Optional leading icon symbol name. */
  symbolName?: string | undefined;
}

/** A menu button description, optionally with a nested submenu of the same shape. */
export interface MenuButtonDescription<
  T extends MenuButtonDescription<T> = BaseMenuButton,
> extends BaseMenuButton {
  /** Optional nested menu shown for this button. */
  submenu?: MenuButtonList<T>;
}

/** A list of menu button descriptions, possibly empty. */
export type MenuButtonList<T extends MenuButtonDescription<T> = BaseMenuButton> = T[];

/** A `MenuButtonList` guaranteed to contain at least one entry. */
export type NonEmptyMenuButtonList<T extends MenuButtonDescription<T> = BaseMenuButton> = [
  T,
  ...T[],
];
