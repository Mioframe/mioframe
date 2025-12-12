import { PathUtils } from './PathUtils';

describe('PathUtils (Юнит-тесты)', () => {
  context('normalize()', () => {
    it('должен нормализовать простые пути', () => {
      expect(PathUtils.normalize('/a/b/c')).to.eq('/a/b/c');
      expect(PathUtils.normalize('a/b')).to.eq('/a/b');
    });

    it('должен удалять лишние слеши', () => {
      expect(PathUtils.normalize('//a///b//')).to.eq('/a/b');
    });

    it('должен обрабатывать переходы на уровень выше (..)', () => {
      expect(PathUtils.normalize('/a/b/../c')).to.eq('/a/c');
      expect(PathUtils.normalize('/a/../../b')).to.eq('/b');
    });

    it('не должен выходить выше корня', () => {
      expect(PathUtils.normalize('/../../a')).to.eq('/a');
    });

    it('должен игнорировать текущую директорию (.)', () => {
      expect(PathUtils.normalize('/a/./b')).to.eq('/a/b');
    });
  });

  context('join()', () => {
    it('должен объединять несколько сегментов', () => {
      expect(PathUtils.join('/a', 'b', 'c')).to.eq('/a/b/c');
    });

    it('должен корректно обрабатывать слеши при объединении', () => {
      expect(PathUtils.join('/a/', '/b/', '//c')).to.eq('/a/b/c');
    });
  });

  context('dirname()', () => {
    it('должен возвращать родительскую директорию', () => {
      expect(PathUtils.dirname('/a/b/c')).to.eq('/a/b');
    });

    it('должен возвращать корень для файлов первого уровня', () => {
      expect(PathUtils.dirname('/a')).to.eq('/');
    });
  });

  context('isChildOrSame()', () => {
    it('должен возвращать true для вложенных путей', () => {
      expect(PathUtils.isChildOrSame('/a', '/a/b')).to.eq(true);
      expect(PathUtils.isChildOrSame('/', '/etc')).to.eq(true);
    });

    it('должен возвращать true для идентичных путей', () => {
      expect(PathUtils.isChildOrSame('/a/b', '/a/b')).to.eq(true);
    });

    it('должен возвращать false для неродственных путей', () => {
      expect(PathUtils.isChildOrSame('/a', '/b')).to.eq(false);
      expect(PathUtils.isChildOrSame('/a/b', '/a')).to.eq(false);
    });
  });
});
