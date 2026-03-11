import { describe, it, expect } from 'vitest';
import { PathUtils } from './PathUtils';

describe('PathUtils', () => {
  describe('normalize', () => {
    it('should normalize paths with redundant slashes', () => {
      expect(PathUtils.normalize('//a//b')).toBe('/a/b');
    });

    it('should handle single dots in path', () => {
      expect(PathUtils.normalize('/a/./b')).toBe('/a/b');
    });

    it('should resolve parent directory references', () => {
      expect(PathUtils.normalize('/a/b/../c')).toBe('/a/c');
    });

    it('should normalize root path correctly', () => {
      expect(PathUtils.normalize('/')).toBe('/');
    });

    it('should handle multiple dots and slashes', () => {
      expect(PathUtils.normalize('/a/./b/../../c')).toBe('/c');
    });
  });

  describe('join', () => {
    it('should join paths correctly', () => {
      expect(PathUtils.join('/a', 'b', 'c')).toBe('/a/b/c');
    });

    it('should handle multiple slashes in arguments', () => {
      expect(PathUtils.join('/a//', '/b/', '/c')).toBe('/a/b/c');
    });
  });

  describe('dirname', () => {
    it('should return parent directory of path', () => {
      expect(PathUtils.dirname('/a/b/c')).toBe('/a/b');
    });

    it('should handle root correctly', () => {
      expect(PathUtils.dirname('/')).toBe('/');
    });

    it('should work with files in root', () => {
      expect(PathUtils.dirname('/file.txt')).toBe('/');
    });
  });

  describe('basename', () => {
    it('should return the final component of path', () => {
      expect(PathUtils.basename('/a/b/c')).toBe('c');
    });

    it('should work with trailing slashes', () => {
      expect(PathUtils.basename('/a/b/')).toBe('b');
    });

    it('should handle root correctly', () => {
      expect(PathUtils.basename('/')).toBe('');
    });
  });

  describe('isChildOrSame', () => {
    it('should return true when child is same as parent', () => {
      expect(PathUtils.isChildOrSame('/a/b', '/a/b')).toBe(true);
    });

    it('should return true when child is descendant of parent', () => {
      expect(PathUtils.isChildOrSame('/a', '/a/b/c')).toBe(true);
    });

    it('should return false when child is not related to parent', () => {
      expect(PathUtils.isChildOrSame('/a', '/b')).toBe(false);
    });

    it('should work correctly with root path', () => {
      expect(PathUtils.isChildOrSame('/', '/a/b/c')).toBe(true);
    });
  });

  describe('isDirectChild', () => {
    it('should return true when child is direct child of parent', () => {
      expect(PathUtils.isDirectChild('/a', '/a/b')).toBe(true);
    });

    it('should return false when child is not directly under parent', () => {
      expect(PathUtils.isDirectChild('/a', '/a/b/c')).toBe(false);
    });

    it('should handle same path case correctly', () => {
      expect(PathUtils.isDirectChild('/a/b', '/a/b')).toBe(true);
    });
  });
});
