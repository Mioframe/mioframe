import type { MenuButtonDescription, NonEmptyMenuButtonList } from './types';

/**
 * Identity helper that lets a non-empty `MenuButtonList` literal be defined with full type
 * inference for its button union, while statically enforcing it has at least one entry.
 * @param value - Non-empty list of menu button descriptions.
 * @returns The same list, unchanged.
 */
export const defineMenuButtonList = <T extends NonEmptyMenuButtonList>(value: T): T => value;

/**
 * Identity helper that lets a single menu button literal be defined with full type inference.
 * @param v - Menu button description.
 * @returns The same value, unchanged.
 */
export const defineMenuButton = <T extends MenuButtonDescription>(v: T) => v;
