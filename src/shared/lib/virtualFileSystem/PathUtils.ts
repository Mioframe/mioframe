export const PathUtils = {
  /**
   * Path separator
   */
  SEPARATOR: '/',

  /**
   * Normalizes a path by removing redundant slashes and processing special characters (., ..)
   * @param path - Path to normalize
   * @returns Normalized path
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
   * Joins multiple paths into a single normalized path
   * @param paths - Array of paths to join
   * @returns Joined normalized path
   */
  join(...paths: string[]): string {
    return this.normalize(paths.join('/'));
  },

  /**
   * Returns the directory path (all except the last component)
   * @param path - Path to process
   * @returns Directory path
   */
  dirname(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    if (lastSlash === -1) return '.';
    return normalized.substring(0, lastSlash);
  },

  /**
   * Returns the filename or directory name from a path
   * @param path - Path to process
   * @returns Filename or directory name
   */
  basename(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  },

  /**
   * Checks if child is a descendant of parent (or the same path).
   * Used for recursive: true
   * @param parent - Parent path
   * @param child - Child path
   * @returns true if child is a descendant of parent or identical to it
   */
  isChildOrSame(parent: string, child: string): boolean {
    if (parent === '/') return true;
    if (parent === child) return true;
    return child.startsWith(`${parent}/`);
  },

  /**
   * Checks if child is a direct child of parent.
   * Used for recursive: false
   * @param parent - Parent path
   * @param child - Child path
   * @returns true if child is a direct child of parent
   */
  isDirectChild(parent: string, child: string): boolean {
    if (parent === child) return true; // Event on the folder itself
    return this.dirname(child) === parent;
  },

  /**
   * Checks if path is the same or a descendant of ancestor.
   * Used for tracking ancestor changes in watch
   * @param path - Path to check
   * @param ancestor - Ancestor path
   * @returns true if path equals ancestor or is inside ancestor
   */
  isSameOrDescendantOf(path: string, ancestor: string): boolean {
    if (ancestor === '/') return true;
    if (path === ancestor) return true;
    return path.startsWith(`${ancestor}/`);
  },
};
