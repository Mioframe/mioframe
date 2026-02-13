export const PathUtils = {
  /**
   * Разделитель пути
   */
  SEPARATOR: '/',

  /**
   * Нормализует путь, удаляя избыточные слеши и обрабатывая специальные символы (., ..)
   * @param path - Путь для нормализации
   * @returns Нормализованный путь
   */
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

  /**
   * Объединяет несколько путей в один нормализованный путь
   * @param paths - Массив путей для объединения
   * @returns Объединённый нормализованный путь
   */
  join(...paths: string[]): string {
    return this.normalize(paths.join('/'));
  },

  /**
   * Возвращает каталог пути (все, кроме последнего компонента)
   * @param path - Путь для обработки
   * @returns Каталог пути
   */
  dirname(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    if (lastSlash === -1) return '.';
    return normalized.substring(0, lastSlash);
  },

  /**
   * Возвращает имя файла или каталога из пути
   * @param path - Путь для обработки
   * @returns Имя файла или каталога
   */
  basename(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  },

  /**
   * Проверяет, является ли child потомком parent (или тем же путем).
   * Используется для recursive: true
   * @param parent - Родительский путь
   * @param child - Дочерний путь
   * @returns true, если child является потомком parent или совпадает с ним
   */
  isChildOrSame(parent: string, child: string): boolean {
    if (parent === '/') return true;
    if (parent === child) return true;
    return child.startsWith(`${parent}/`);
  },

  /**
   * Проверяет, является ли child ПРЯМЫМ потомком parent.
   * Используется для recursive: false
   * @param parent - Родительский путь
   * @param child - Дочерний путь
   * @returns true, если child является прямым потомком parent
   */
  isDirectChild(parent: string, child: string): boolean {
    if (parent === child) return true; // Событие на самой папке
    return this.dirname(child) === parent;
  },
};
