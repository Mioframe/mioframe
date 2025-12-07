/// <reference types="cypress" />

import { LockManager } from './LockManager';

describe('LockManager (Unit)', () => {
  let manager: LockManager;

  beforeEach(() => {
    manager = new LockManager();
  });

  it('должен выполнять задачу и возвращать результат', async () => {
    // Исправлено: async без await заменен на Promise.resolve
    const result = await manager.request('/file', () =>
      Promise.resolve('success'),
    );
    expect(result).to.eq('success');
  });

  it('должен выстраивать задачи в очередь для одного пути (Sequential Execution)', async () => {
    const path = '/locked';
    const executionOrder: number[] = [];

    // Задача 1: Медленная (50мс)
    const task1 = manager.request(path, async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      executionOrder.push(1);
      return 1;
    });

    // Задача 2: Быстрая (мгновенная), но запущена после Task 1
    // Исправлено: добавлен await Promise.resolve() для удовлетворения правила require-await
    const task2 = manager.request(path, async () => {
      await Promise.resolve();
      executionOrder.push(2);
      return 2;
    });

    await Promise.all([task1, task2]);

    // Проверяем порядок: Task 2 должен был ждать завершения Task 1
    expect(executionOrder).to.deep.eq([1, 2]);
  });

  it('не должен блокировать разные пути друг другом (Parallel Execution)', async () => {
    const executionOrder: string[] = [];

    // Задача A: Медленная на пути /a
    const taskA = manager.request('/a', async () => {
      await new Promise((r) => setTimeout(r, 50));
      executionOrder.push('A');
    });

    // Задача B: Быстрая на пути /b
    // Исправлено: добавлен await Promise.resolve()
    const taskB = manager.request('/b', async () => {
      await Promise.resolve();
      executionOrder.push('B');
    });

    await Promise.all([taskA, taskB]);

    // B должна завершиться раньше A, так как они не блокируют друг друга
    expect(executionOrder).to.deep.eq(['B', 'A']);
  });

  it('должен продолжать работу очереди, даже если задача упала с ошибкой', async () => {
    const path = '/error-path';
    let task2Ran = false;

    // Задача 1: Падает с ошибкой
    // Исправлено: добавлен await Promise.resolve()
    const task1 = manager.request(path, async () => {
      await Promise.resolve();
      throw new Error('Fail');
    });

    // Задача 2: Должна выполниться успешно после падения первой
    // Исправлено: добавлен await Promise.resolve()
    const task2 = manager.request(path, async () => {
      await Promise.resolve();
      task2Ran = true;
      return 'Success';
    });

    // Ожидаем ошибку от первой задачи
    try {
      await task1;
      throw new Error('Task 1 should fail');
    } catch (e: unknown) {
      // Исправлено: безопасная проверка типа ошибки вместо any
      if (e instanceof Error) {
        expect(e.message).to.eq('Fail');
      } else {
        throw e;
      }
    }

    // Ожидаем успех от второй
    const res = await task2;
    expect(res).to.eq('Success');
    // Исправлено: .to.be.true -> .to.eq(true)
    expect(task2Ran).to.eq(true);
  });

  it('должен очищать память (Garbage Collection) после завершения', async () => {
    const path = '/gc-test';

    // Исправлено: .to.be.false -> .to.eq(false)
    expect(manager.isLocked(path)).to.eq(false);

    // Запускаем задачу
    const task = manager.request(path, async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Во время выполнения путь должен быть заблокирован
    // Исправлено: .to.be.true -> .to.eq(true)
    expect(manager.isLocked(path)).to.eq(true);

    await task;

    // Даем микрозадачам (microtasks) время на отработку цепочки промисов в LockManager
    // так как очистка происходит в .then() после завершения задачи
    await new Promise((r) => setTimeout(r, 10));

    // Проверяем, что блокировка снята и Map очищен (isLocked проверяет наличие ключа)
    // Исправлено: .to.be.false -> .to.eq(false)
    expect(manager.isLocked(path)).to.eq(false);
  });

  it('должен корректно обрабатывать вложенные запросы (Reentrancy check)', async () => {
    // В текущей реализации LockManager НЕ поддерживает реентерабельность (reentrancy).
    // Тест фиксирует поведение: вложенный запрос встает в очередь.
    await manager.request('/outer', async () => {
      // Исправлено: async () => 'inner' -> () => Promise.resolve('inner')
      const innerResult = await manager.request('/inner', () =>
        Promise.resolve('inner'),
      );
      expect(innerResult).to.eq('inner');
    });
  });

  it('должен выдерживать высокую нагрузку (Stress Test - 50 tasks)', async () => {
    const path = '/stress-test';
    const count = 50;
    const results: number[] = [];
    const tasks: Promise<void>[] = [];

    // Запускаем 50 задач одновременно
    for (let i = 0; i < count; i++) {
      tasks.push(
        manager.request(path, async () => {
          // Имитируем случайную задержку, чтобы проверить устойчивость порядка
          await new Promise((r) => setTimeout(r, Math.random() * 5));
          results.push(i);
        }),
      );
    }

    await Promise.all(tasks);

    // Проверяем, что все 50 задач выполнились
    expect(results).to.have.length(count);

    // Проверяем, что порядок СТРОГО соблюден (0, 1, 2... 49),
    // несмотря на случайные задержки внутри задач.
    const expected = Array.from({ length: count }, (_, i) => i);
    expect(results).to.deep.eq(expected);
  });

  it('должен мгновенно сообщать о блокировке (isLocked sync check)', async () => {
    const path = '/sync-check';

    const task = manager.request(path, async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Сразу после вызова (синхронно) путь должен быть заблокирован
    // Исправлено: .to.be.true -> .to.eq(true)
    expect(manager.isLocked(path)).to.eq(true);

    await task;
  });
});
