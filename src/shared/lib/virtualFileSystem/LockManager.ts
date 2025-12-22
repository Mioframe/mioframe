/**
 * Управляет блокировками ресурсов по пути.
 * Гарантирует, что операции над одним файлом выполняются последовательно.
 */
export class LockManager {
  // Храним "хвост" очереди промисов для каждого пути.
  // Promise<void> гарантирует, что мы ждем завершения предыдущей задачи,
  // независимо от того, завершилась она успешно или с ошибкой.
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

    // 1. Создаем промис с результатом для вызывающего кода.
    // Он ждет currentLock, затем выполняет задачу.
    const taskPromise = currentLock.then(() => exclusiveTask());

    // 2. Создаем новый хвост для очереди.
    // Нам важно лишь завершение задачи (успех или ошибка), чтобы запустить следующую.
    // .catch() подавляет ошибку в цепочке очереди, но не в taskPromise.
    const nextTail = taskPromise.then(() => {}).catch(() => {});

    // 3. Обновляем Map новым хвостом
    this.locks.set(path, nextTail);

    // 4. Garbage Collection (очистка памяти)
    // Когда этот хвост отработает, проверяем: если он все еще последний в Map, удаляем запись.
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
