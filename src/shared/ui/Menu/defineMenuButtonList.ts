import type { MenuButtonDescription, MenuButtonList } from './types';

export const defineMenuButtonList = <T extends MenuButtonList>(value: T): T =>
  value;

export const defineMenuButton = <T extends MenuButtonDescription>(v: T) => v;
