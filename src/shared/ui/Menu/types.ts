export interface BaseMenuButton {
  label: string;
  key: string | number;
  symbolName?: string | undefined;
}

export interface MenuButtonDescription<
  T extends MenuButtonDescription<T> = BaseMenuButton,
> extends BaseMenuButton {
  submenu?: MenuButtonList<T>;
}

export type MenuButtonList<T extends MenuButtonDescription<T> = BaseMenuButton> = T[];
