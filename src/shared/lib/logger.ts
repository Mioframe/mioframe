/**
 * Настройки логгера
 */
interface LogOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  showArgs?: boolean;
  showResult?: boolean;
  showTime?: boolean;
}

/**
 * Цветовая схема для консоли браузера
 */
const COLORS = {
  debug: '#7f8c8d',
  info: '#2ecc71',
  warn: '#f1c40f',
  error: '#e74c3c',
};

/**
 * Легкий декоратор для логирования (TC39 Stage 3 / TS 5.0+)
 */
export function Log(options: LogOptions = {}) {
  const {
    level = 'info',
    showArgs = true,
    showResult = true,
    showTime = true,
  } = options;

  return function <This, Args extends any[], Return>(
    originalMethod: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ) {
    const methodName = String(context.name);

    // Возвращаем новую функцию-обертку
    return function (this: This, ...args: Args): Return {
      const start = performance.now();
      const color = COLORS[level];

      // Группируем логи для чистоты консоли
      console.groupCollapsed(
        `%c[${level.toUpperCase()}]%c ${methodName}`,
        `color: white; background: ${color}; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
        'color: inherit; font-weight: bold;',
      );

      if (showArgs) {
        console.log('%cАргументы:', 'color: #3498db; font-weight: bold;', args);
      }

      try {
        const result = originalMethod.apply(this, args);

        // Обработка промисов (если метод асинхронный)
        if (result instanceof Promise) {
          return result
            .then((val) => {
              logSuccess(val, start);
              return val;
            })
            .catch((err) => {
              logError(err);
              throw err;
            }) as Return;
        }

        logSuccess(result, start);
        return result;
      } catch (error) {
        logError(error);
        throw error;
      } finally {
        // Всегда закрываем группу в консоли
        console.groupEnd();
      }

      function logSuccess(res: any, startTime: number) {
        if (showResult) {
          console.log(
            '%cРезультат:',
            'color: #2ecc71; font-weight: bold;',
            res,
          );
        }
        if (showTime) {
          const duration = (performance.now() - startTime).toFixed(2);
          console.log(
            '%cВремя выполнения:',
            'color: #9b59b6; font-weight: bold;',
            `${duration}ms`,
          );
        }
      }

      function logError(err: any) {
        console.error('%cОшибка:', 'color: #e74c3c; font-weight: bold;', err);
      }
    };
  };
}

// --- Пример использования ---

class TestService {
  @Log({ level: 'info', showTime: true })
  calculateSum(a: number, b: number): number {
    return a + b;
  }

  @Log({ level: 'debug', showArgs: true })
  async fetchData(id: string) {
    return new Promise((res) =>
      setTimeout(() => {
        res({ id, status: 'ok' });
      }, 500),
    );
  }

  @Log({ level: 'error' })
  throwError() {
    throw new Error('Тестовая ошибка');
  }
}

// Тестирование
const service = new TestService();
service.calculateSum(10, 20);
service.fetchData('user-123');
try {
  service.throwError();
} catch {}
