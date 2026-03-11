import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockManager } from './LockManager';

describe('LockManager', () => {
  let lockManager: LockManager;

  beforeEach(() => {
    lockManager = new LockManager();
  });

  describe('request', () => {
    it('should execute exclusive tasks sequentially for the same path', async () => {
      // Create a mock task that resolves after a delay
      const task1 = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'task1';
      });

      const task2 = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'task2';
      });

      // Execute tasks in parallel
      const promise1 = lockManager.request('/test', task1);
      const promise2 = lockManager.request('/test', task2);

      // Both should resolve successfully
      const result1 = await promise1;
      const result2 = await promise2;

      // Verify the results
      expect(result1).toBe('task1');
      expect(result2).toBe('task2');

      // Verify that both tasks were called in order
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });

    it('should handle different paths concurrently', async () => {
      const task1 = vi.fn().mockResolvedValue('result1');
      const task2 = vi.fn().mockResolvedValue('result2');

      // Execute tasks with different paths in parallel
      const promise1 = lockManager.request('/test1', task1);
      const promise2 = lockManager.request('/test2', task2);

      // Both should resolve successfully
      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');

      // Verify both tasks were called
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in exclusive tasks properly', async () => {
      const error = new Error('Task failed');

      const failingTask = vi.fn().mockRejectedValue(error);
      const successfulTask = vi.fn().mockResolvedValue('success');

      // Execute a failing task followed by a success task
      const promise1 = lockManager.request('/error', failingTask);
      const promise2 = lockManager.request('/error', successfulTask);

      // First should fail
      await expect(promise1).rejects.toThrow(error);

      // Second should succeed after the first one fails
      await expect(promise2).resolves.toBe('success');
    });

    it('should properly queue tasks when a path is already locked', async () => {
      const taskOrder: string[] = [];

      const task1 = vi.fn().mockImplementation(async () => {
        taskOrder.push('task1');
        await new Promise((resolve) => setTimeout(resolve, 10));
        taskOrder.push('task1 end');
        return 'result1';
      });

      const task2 = vi.fn().mockImplementation(async () => {
        taskOrder.push('task2');
        await new Promise((resolve) => setTimeout(resolve, 5));
        taskOrder.push('task2 end');
        return 'result2';
      });

      // Execute tasks with same path in parallel
      const promise1 = lockManager.request('/locked', task1);
      const promise2 = lockManager.request('/locked', task2);

      // Both should resolve successfully
      const result1 = await promise1;
      const result2 = await promise2;

      // Verify correct execution order (task1 must complete before task2)
      expect(taskOrder).toEqual(['task1', 'task1 end', 'task2', 'task2 end']);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });
  });

  describe('isLocked', () => {
    it('should return false for unlocked paths', () => {
      const isLocked = lockManager.isLocked('/test');
      expect(isLocked).toBe(false);
    });

    it('should return true when a path is locked during execution', async () => {
      // Start an asynchronous task
      const promise = lockManager.request('/locking', async () => {
        // Check if the path is locked while this function executes
        const isLocked = lockManager.isLocked('/locking');
        expect(isLocked).toBe(true);

        return await new Promise((resolve) =>
          setTimeout(() => {
            resolve('result');
          }, 10),
        );
      });

      // Verify that the path appears to be locked during execution
      expect(lockManager.isLocked('/locking')).toBe(true);

      const result = await promise;
      expect(result).toBe('result');
    });
  });
});
