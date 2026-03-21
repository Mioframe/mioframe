import { LockManager } from './LockManager';

describe('LockManager (Unit)', () => {
  let manager: LockManager;

  beforeEach(() => {
    manager = new LockManager();
  });

  it('должен выполнять задачу и возвращать результат', async () => {
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

    // Задача 2: Быстрая, но должна ждать первую
    const task2 = manager.request(path, () => {
      executionOrder.push(2);
      return Promise.resolve(2);
    });

    await Promise.all([task1, task2]);

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
    const taskB = manager.request('/b', () => {
      executionOrder.push('B');
      return Promise.resolve();
    });

    await Promise.all([taskA, taskB]);

    // B должна завершиться раньше A
    expect(executionOrder).to.deep.eq(['B', 'A']);
  });

  it('должен продолжать работу очереди, даже если задача упала с ошибкой', async () => {
    const path = '/error-path';
    let task2Ran = false;

    // Задача 1: Падает с ошибкой
    const task1 = manager.request(path, () => {
      return Promise.reject(new Error('Fail'));
    });

    // Задача 2: Должна выполниться успешно после падения первой
    const task2 = manager.request(path, () => {
      task2Ran = true;
      return Promise.resolve('Success');
    });

    // Ожидаем ошибку от первой задачи
    try {
      await task1;
      throw new Error('Task 1 should fail');
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- error type narrowing in test
      expect((e as Error).message).to.eq('Fail');
    }

    // Ожидаем успех от второй
    const res = await task2;
    expect(res).to.eq('Success');
    expect(task2Ran).to.eq(true);
  });

  it('должен очищать память (Garbage Collection) после завершения', async () => {
    const path = '/gc-test';

    expect(manager.isLocked(path)).to.eq(false);

    const task = manager.request(path, async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(manager.isLocked(path)).to.eq(true);

    await task;

    // Ждем микрозадачи (очистка происходит в .then())
    await new Promise((r) => setTimeout(r, 10));

    expect(manager.isLocked(path)).to.eq(false);
  });

  it('должен позволять вложенные запросы на РАЗНЫЕ пути (No Deadlock on distinct paths)', async () => {
    await manager.request('/outer', async () => {
      const innerResult = await manager.request('/inner', () =>
        Promise.resolve('inner'),
      );
      expect(innerResult).to.eq('inner');
    });
  });

  it('должен выдерживать высокую нагрузку (Stress Test)', async () => {
    const path = '/stress-test';
    const count = 50;
    const results: number[] = [];
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      tasks.push(
        manager.request(path, async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 5));
          results.push(i);
        }),
      );
    }

    await Promise.all(tasks);

    expect(results).to.have.length(count);
    // Проверяем строгую последовательность
    const expected = Array.from({ length: count }, (_, i) => i);
    expect(results).to.deep.eq(expected);
  });
});
