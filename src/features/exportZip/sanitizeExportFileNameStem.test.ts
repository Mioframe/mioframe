import { describe, expect, it } from 'vitest';
import { sanitizeExportFileNameStem } from './sanitizeExportFileNameStem';

describe('sanitizeExportFileNameStem', () => {
  it('returns the trimmed name unchanged when already safe', () => {
    expect(sanitizeExportFileNameStem('  My Repository  ')).toBe('My Repository');
  });

  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeExportFileNameStem('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('strips trailing dots and spaces', () => {
    expect(sanitizeExportFileNameStem('name...  ')).toBe('name');
  });

  it('falls back to the default name when the input is empty', () => {
    expect(sanitizeExportFileNameStem('')).toBe('export');
  });

  it('falls back to a custom name when provided', () => {
    expect(sanitizeExportFileNameStem('   ', 'root')).toBe('root');
  });

  it('falls back when sanitizing leaves nothing usable', () => {
    expect(sanitizeExportFileNameStem('...')).toBe('export');
  });
});
