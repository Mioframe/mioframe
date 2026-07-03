import { describe, expect, it, vi } from 'vitest';

import {
  isPackageJsonVersionOnlyChange,
  isVisualRelevantPackageJsonChange,
} from './packageJsonImpact.mjs';

describe('isPackageJsonVersionOnlyChange', () => {
  it('returns true when only the version field changed', () => {
    const oldContent = JSON.stringify({ name: 'mioframe', version: '0.1.0', scripts: { a: '1' } });
    const newContent = JSON.stringify({ name: 'mioframe', version: '0.1.1', scripts: { a: '1' } });

    expect(isPackageJsonVersionOnlyChange(oldContent, newContent)).toBe(true);
  });

  it('returns true when nothing changed at all', () => {
    const content = JSON.stringify({ name: 'mioframe', version: '0.1.0' });

    expect(isPackageJsonVersionOnlyChange(content, content)).toBe(true);
  });

  it('is unaffected by key ordering or whitespace differences', () => {
    const oldContent = '{\n  "version": "0.1.0",\n  "name": "mioframe"\n}\n';
    const newContent = '{"name":"mioframe","version":"0.1.1"}';

    expect(isPackageJsonVersionOnlyChange(oldContent, newContent)).toBe(true);
  });

  it('returns false when a dependency changed', () => {
    const oldContent = JSON.stringify({
      version: '0.1.0',
      dependencies: { vue: '1.0.0' },
    });
    const newContent = JSON.stringify({
      version: '0.1.1',
      dependencies: { vue: '1.0.1' },
    });

    expect(isPackageJsonVersionOnlyChange(oldContent, newContent)).toBe(false);
  });

  it('returns false when scripts changed', () => {
    const oldContent = JSON.stringify({ version: '0.1.0', scripts: { build: 'vite build' } });
    const newContent = JSON.stringify({ version: '0.1.0', scripts: { build: 'vite build --x' } });

    expect(isPackageJsonVersionOnlyChange(oldContent, newContent)).toBe(false);
  });

  it('returns false when packageManager changed', () => {
    const oldContent = JSON.stringify({ version: '0.1.0', packageManager: 'pnpm@9.0.0' });
    const newContent = JSON.stringify({ version: '0.1.0', packageManager: 'pnpm@9.1.0' });

    expect(isPackageJsonVersionOnlyChange(oldContent, newContent)).toBe(false);
  });

  it('returns false when either content is invalid JSON', () => {
    const validContent = JSON.stringify({ version: '0.1.0' });

    expect(isPackageJsonVersionOnlyChange('not json', validContent)).toBe(false);
    expect(isPackageJsonVersionOnlyChange(validContent, 'not json')).toBe(false);
  });

  it('returns false when either content is not a JSON object', () => {
    const validContent = JSON.stringify({ version: '0.1.0' });

    expect(isPackageJsonVersionOnlyChange('[1,2,3]', validContent)).toBe(false);
    expect(isPackageJsonVersionOnlyChange(validContent, 'null')).toBe(false);
  });
});

describe('isVisualRelevantPackageJsonChange', () => {
  it('fails closed (visual-relevant) when no base ref is known', () => {
    const spawn = vi.fn();
    const readFile = vi.fn();

    expect(isVisualRelevantPackageJsonChange({ oldRef: null, spawn, readFile })).toBe(true);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('fails closed (visual-relevant) when git show fails', () => {
    const spawn = vi.fn().mockReturnValue({ status: 1, stdout: '' });
    const readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.1.0' }));

    expect(isVisualRelevantPackageJsonChange({ oldRef: 'origin/develop', spawn, readFile })).toBe(
      true,
    );
  });

  it('fails closed (visual-relevant) when the current file cannot be read', () => {
    const spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.1.0' }),
    });
    const readFile = vi.fn().mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(isVisualRelevantPackageJsonChange({ oldRef: 'HEAD~1', spawn, readFile })).toBe(true);
  });

  it('is not visual-relevant for a confirmed version-only change', () => {
    const spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ name: 'mioframe', version: '0.1.0' }),
    });
    const readFile = vi
      .fn()
      .mockReturnValue(JSON.stringify({ name: 'mioframe', version: '0.1.1' }));

    expect(isVisualRelevantPackageJsonChange({ oldRef: 'HEAD~1', spawn, readFile })).toBe(false);
    expect(spawn).toHaveBeenCalledWith('git', ['show', 'HEAD~1:package.json'], expect.any(Object));
    expect(readFile).toHaveBeenCalledWith('package.json', 'utf8');
  });

  it('is visual-relevant when dependencies changed alongside version', () => {
    const spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.1.0', dependencies: { vue: '1.0.0' } }),
    });
    const readFile = vi
      .fn()
      .mockReturnValue(JSON.stringify({ version: '0.1.1', dependencies: { vue: '1.0.1' } }));

    expect(isVisualRelevantPackageJsonChange({ oldRef: 'HEAD~1', spawn, readFile })).toBe(true);
  });
});
