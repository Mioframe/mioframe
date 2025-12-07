/**
 * Управляет блокировками ресурсов по пути.
 * Гарантирует, что операции над одним файлом выполняются последовательно.
 */
export class LockManager {
  // Храним "хвост" очереди. Он всегда void и всегда успешный (catch внутри),
  // чтобы ошибка в одной задаче не ломала всю очередь.
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Выполняет функцию exclusiveTask в режиме эксклюзивного доступа к path.
   * Если path уже занят, ставит задачу в очередь.
   */
  public async request<T>(
    path: string,
    exclusiveTask: () => Promise<T>,
  ): Promise<T> {
    // Получаем текущий хвост очереди (или resolved промис, если очереди нет)
    const currentLock = this.locks.get(path) ?? Promise.resolve();

    // 1. Создаем промис с результатом для caller-а.
    // Он ждет currentLock, выполняет задачу и возвращает T.
    // Если задача упадет, этот промис будет rejected (чтобы caller узнал об ошибке).
    const taskPromise = currentLock.then(() => exclusiveTask());

    // 2. Создаем новый хвост для очереди (Chain Link).
    // Нам не важен результат T, нам важно лишь завершение.
    // .then(...) преобразует T в void.
    // .catch(...) подавляет ошибку, чтобы следующие задачи в очереди выполнились.
    const nextTail = taskPromise
      .then(() => {
        // drop result
      })
      .catch(() => {
        // suppress error for the queue chain
      });

    // 3. Обновляем Map новым хвостом
    this.locks.set(path, nextTail);

    // 4. Garbage Collection (очистка памяти)
    // Когда этот хвост отработает, проверяем: если он все еще последний в Map, удаляем запись.
    // Мы используем nextTail, потому что именно его мы положили в Map.
    void nextTail.then(() => {
      if (this.locks.get(path) === nextTail) {
        this.locks.delete(path);
      }
    });

    return taskPromise;
  }

  /**
   * Проверяет, заблокирован ли путь в данный момент.
   */
  public isLocked(path: string): boolean {
    return this.locks.has(path);
  }
}
