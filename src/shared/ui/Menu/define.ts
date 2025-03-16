import type { ContextButtonList } from './types';

export const defineContextButtonList = <T extends ContextButtonList>(
  value: T,
): T => value;
