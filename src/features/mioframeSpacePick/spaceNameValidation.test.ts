import { describe, expect, it } from 'vitest';
import {
  getMioframeSpaceNameError,
  normalizeMioframeSpaceName,
  parseMioframeSpaceName,
} from './spaceNameValidation';

describe('parseMioframeSpaceName', () => {
  it('returns the empty-name error for an empty string', () => {
    expect(parseMioframeSpaceName('')).toEqual({
      success: false,
      error: 'Enter a space name.',
    });
  });

  it('returns the empty-name error for whitespace only input', () => {
    expect(parseMioframeSpaceName('   ')).toEqual({
      success: false,
      error: 'Enter a space name.',
    });
  });

  it('returns the trimmed name for valid input', () => {
    expect(parseMioframeSpaceName('  Work Notes  ')).toEqual({
      success: true,
      name: 'Work Notes',
    });
  });

  it('rejects a single dot folder name', () => {
    expect(parseMioframeSpaceName('.')).toEqual({
      success: false,
      error: 'Enter a valid folder name.',
    });
  });

  it('rejects a double dot folder name', () => {
    expect(parseMioframeSpaceName('..')).toEqual({
      success: false,
      error: 'Enter a valid folder name.',
    });
  });

  it('rejects path-invalid characters', () => {
    expect(parseMioframeSpaceName('Work/Notes')).toEqual({
      success: false,
      error: 'Enter a valid folder name.',
    });
    expect(parseMioframeSpaceName('Work\\Notes')).toEqual({
      success: false,
      error: 'Enter a valid folder name.',
    });
  });

  it('rejects control characters', () => {
    expect(parseMioframeSpaceName('Work\u0000Notes')).toEqual({
      success: false,
      error: 'Enter a valid folder name.',
    });
  });
});

describe('spaceNameValidation compatibility helpers', () => {
  it('keeps normalizeMioframeSpaceName aligned with parser normalization', () => {
    expect(normalizeMioframeSpaceName('  Work Notes  ')).toBe('Work Notes');
  });

  it('keeps getMioframeSpaceNameError aligned with parser failures', () => {
    expect(getMioframeSpaceNameError('..')).toBe('Enter a valid folder name.');
    expect(getMioframeSpaceNameError('  ')).toBe('Enter a space name.');
  });
});
