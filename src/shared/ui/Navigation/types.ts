export interface NavigationButton {
  label: string;
  symbol: string;
}

export type NavigationList = NavigationButton[];

export const defineNavigationButtonList = <T extends NavigationButton>(
  ...v: T[]
) => v;

export const defineNavigationButton = <T extends NavigationButton>(v: T) => v;
