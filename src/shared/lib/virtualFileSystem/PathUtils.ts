export const PathUtils = {
  SEPARATOR: '/',

  normalize(path: string): string {
    const parts = path.split(/\/+/);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return `/${stack.join('/')}`;
  },

  join(...paths: string[]): string {
    return this.normalize(paths.join('/'));
  },

  dirname(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    if (lastSlash === -1) return '.';
    return normalized.substring(0, lastSlash);
  },

  basename(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  },

  /**
   * Проверяет, является ли child потомком parent (или тем же путем).
   * Используется для recursive: true
   */
  isChildOrSame(parent: string, child: string): boolean {
    if (parent === '/') return true;
    if (parent === child) return true;
    return child.startsWith(`${parent}/`);
  },

  /**
   * Проверяет, является ли child ПРЯМЫМ потомком parent.
   * Используется для recursive: false
   */
  isDirectChild(parent: string, child: string): boolean {
    if (parent === child) return true; // Событие на самой папке
    return this.dirname(child) === parent;
  },
};
