export type VfsChangeType = 'create' | 'update' | 'delete' | 'rename';

export interface VfsEvent {
  type: VfsChangeType;
  /** Путь относительно корня (для VFS) или корня провайдера (для драйверов) */
  path: string;
  /** Для события rename — новый путь */
  newPath?: string;
}

/**
 * Вспомогательный класс для управления подписками.
 * Используется и в VFS, и в драйверах.
 */
export class EventEmitter {
  private listeners: Set<(event: VfsEvent) => void> = new Set();
  private errorHandler: (error: unknown) => void;

  /**
   * @param errorHandler Функция для обработки ошибок в подписчиках.
   * По умолчанию выводит ошибку в console.error.
   */
  constructor(errorHandler?: (error: unknown) => void) {
    this.errorHandler =
      errorHandler ||
      ((e) => {
        // eslint-disable-next-line no-console -- for isolate
        console.error('VFS Event Listener Error:', e);
      });
  }

  public subscribe(callback: (event: VfsEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public emit(event: VfsEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        this.errorHandler(e);
      }
    }
  }
}
