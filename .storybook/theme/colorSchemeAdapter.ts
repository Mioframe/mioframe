/**
 * Storybook toolbar adapter for the Material foundation-owned theme-mode seam
 * (`src/shared/ui/material/foundation/theme.css`). This file only sets/removes the
 * `data-md-color-scheme` attribute the foundation already understands; it owns no theme
 * values (docs/testing/storybook.md "Theme mode application belongs to the production
 * Material/theme foundation owner").
 */
export type StorybookColorScheme = 'system' | 'light' | 'dark';

export const STORYBOOK_COLOR_SCHEME_GLOBAL_KEY = 'colorScheme';
export const STORYBOOK_COLOR_SCHEME_DEFAULT: StorybookColorScheme = 'system';

/**
 * Apply the current Storybook theme global to the document root. `system` removes the
 * attribute entirely, preserving the application's normal `prefers-color-scheme` default.
 * @param colorScheme - The current `globals.colorScheme` value from Storybook toolbar state.
 */
export function applyStorybookColorScheme(colorScheme: unknown): void {
  const root = document.documentElement;

  if (colorScheme === 'light' || colorScheme === 'dark') {
    root.setAttribute('data-md-color-scheme', colorScheme);
    return;
  }

  root.removeAttribute('data-md-color-scheme');
}
