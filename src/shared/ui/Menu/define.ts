import type { MenuButtonList } from './types';

export const defineMenuButtonList = <T extends MenuButtonList>(value: T): T =>
  value;
