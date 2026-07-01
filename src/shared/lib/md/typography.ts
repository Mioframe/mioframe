/**
 * Stable Material 3 type scale utility class names, grouped by scale
 * (`display`, `label`, `body`, `headline`, `title`) and size (`large`,
 * `medium`, `small`). Each value is a global `.md-typescale-*` class defined
 * in `shared/lib/md/typography.css`; apply it via `:class` to typography-only
 * elements to opt into Material's type ramp without hand-rolled font styles.
 */
export const MD_TYPESCALE = {
  display: {
    large: 'md-typescale-display-large',
    medium: 'md-typescale-display-medium',
    small: 'md-typescale-display-small',
  },
  label: {
    large: 'md-typescale-label-large',
    medium: 'md-typescale-label-medium',
    small: 'md-typescale-label-small',
  },
  body: {
    large: 'md-typescale-body-large',
    medium: 'md-typescale-body-medium',
    small: 'md-typescale-body-small',
  },
  headline: {
    large: 'md-typescale-headline-large',
    medium: 'md-typescale-headline-medium',
    small: 'md-typescale-headline-small',
  },
  title: {
    large: 'md-typescale-title-large',
    medium: 'md-typescale-title-medium',
    /**
     * Suitable for list subheadings
     */
    small: 'md-typescale-title-small',
  },
} as const;
