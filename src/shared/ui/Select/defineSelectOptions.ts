import type { SelectOption } from './types';

export const defineSelectOptions = <T extends SelectOption>(v: T[]) => v;

export const defineSelectOption = <T extends SelectOption>(v: T) => v;
