export interface MenuButtonDescription {
  text: string;
  symbolName: string;
}

export type MenuButtonList = Iterable<[PropertyKey, MenuButtonDescription]>;
