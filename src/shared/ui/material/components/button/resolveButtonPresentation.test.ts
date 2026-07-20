import { describe, expect, it } from 'vitest';
import {
  isUnsupportedTextToggle,
  resolveAppliedSelected,
  resolveAppliedVariant,
  resolveLabelTypescaleClass,
} from './resolveButtonPresentation';

describe('isUnsupportedTextToggle', () => {
  it('is true only for color="text" combined with variant="toggle"', () => {
    expect(isUnsupportedTextToggle('text', 'toggle')).toBe(true);
    expect(isUnsupportedTextToggle('text', 'default')).toBe(false);
    expect(isUnsupportedTextToggle('filled', 'toggle')).toBe(false);
    expect(isUnsupportedTextToggle('elevated', 'toggle')).toBe(false);
    expect(isUnsupportedTextToggle('tonal', 'toggle')).toBe(false);
    expect(isUnsupportedTextToggle('outlined', 'toggle')).toBe(false);
  });
});

describe('resolveAppliedVariant', () => {
  it('normalizes text+toggle to default', () => {
    expect(resolveAppliedVariant('text', 'toggle')).toBe('default');
  });

  it('preserves toggle for every other color', () => {
    expect(resolveAppliedVariant('filled', 'toggle')).toBe('toggle');
    expect(resolveAppliedVariant('tonal', 'toggle')).toBe('toggle');
    expect(resolveAppliedVariant('outlined', 'toggle')).toBe('toggle');
    expect(resolveAppliedVariant('elevated', 'toggle')).toBe('toggle');
  });

  it('preserves default for every color', () => {
    expect(resolveAppliedVariant('text', 'default')).toBe('default');
    expect(resolveAppliedVariant('filled', 'default')).toBe('default');
  });
});

describe('resolveAppliedSelected', () => {
  it('is false when the applied variant is not toggle', () => {
    expect(resolveAppliedSelected('text', 'toggle', true)).toBe(false);
    expect(resolveAppliedSelected('filled', 'default', true)).toBe(false);
  });

  it('reflects selected only when the applied variant is toggle', () => {
    expect(resolveAppliedSelected('filled', 'toggle', true)).toBe(true);
    expect(resolveAppliedSelected('filled', 'toggle', false)).toBe(false);
    expect(resolveAppliedSelected('filled', 'toggle', undefined)).toBe(false);
  });
});

describe('resolveLabelTypescaleClass', () => {
  it('maps every size to its documented typescale class', () => {
    expect(resolveLabelTypescaleClass('extra-small')).toBe('md-typescale-label-large');
    expect(resolveLabelTypescaleClass('small')).toBe('md-typescale-label-large');
    expect(resolveLabelTypescaleClass('medium')).toBe('md-typescale-title-medium');
    expect(resolveLabelTypescaleClass('large')).toBe('md-typescale-headline-small');
    expect(resolveLabelTypescaleClass('extra-large')).toBe('md-typescale-headline-large');
  });
});
