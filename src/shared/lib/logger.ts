import { toRaw } from 'vue';

/* eslint-disable no-console -- This is a logger utility, console is the intended output */
interface LogOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Whether to log function arguments. @default false */
  showArgs?: boolean;
  /** Whether to log the function result. @default false */
  showResult?: boolean;
  /** Whether to log execution time. @default false */
  showTime?: boolean;
  /**
   * Whether to snapshot large objects before logging.
   * ⚠️ Warning: Can significantly slow down logging for large objects.
   * @default false
   */
  snapshot?: boolean;
  /** Whether to show execution ID in log output. @default false */
  showExecId?: boolean;
}

/** @readonly */
const COLORS = {
  debug: '#7f8c8d',
  info: '#2ecc71',
  warn: '#f1c40f',
  error: '#e74c3c',
} as const;

const generateExecId = (): string => Math.random().toString(36).slice(2, 6);

const isThenable = (value: unknown): value is Promise<unknown> => {
  if (value == null) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Safe type assertion for thenable check
    const then = (value as { then?: unknown }).then;
    return typeof then === 'function';
  } catch {
    return false;
  }
};

const snapshotValue = <T>(value: T, enabled: boolean): T => {
  if (!enabled) return value;
  const raw = toRaw(value);
  try {
    return structuredClone(raw);
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-explicit-any -- JSON fallback is lossy, requires double cast
      return JSON.parse(JSON.stringify(raw)) as any as T;
    } catch {
      return raw;
    }
  }
};

function logExecution<Args extends unknown[], Return>(
  this: unknown,
  fn: (...args: Args) => Return,
  args: Args,
  name: string,
  options: LogOptions,
): Return {
  const {
    level = 'info',
    showArgs = false,
    showResult = false,
    showTime = false,
    snapshot = false,
    showExecId = false,
  } = options;
  const start = performance.now();
  const color = COLORS[level];
  const execId = showExecId ? ` #${generateExecId()}` : '';

  const logSuccess = (res: unknown, startTime: number) => {
    if (showResult)
      console.log(
        '%cResult:',
        `color: ${COLORS.info}; font-weight: bold;`,
        snapshotValue(res, snapshot),
      );
    if (showTime)
      console.log(
        '%cExecution time:',
        `color: ${COLORS.warn}; font-weight: bold;`,
        `${(performance.now() - startTime).toFixed(2)}ms`,
      );
  };

  const logError = (err: unknown) => {
    console.error(
      '%cError:',
      `color: ${COLORS.error}; font-weight: bold;`,
      err,
    );
  };

  console.groupCollapsed(
    `%c[${level.toUpperCase()}]%c ${name}${execId}`,
    `color: white; background: ${color}; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
    'color: inherit; font-weight: bold;',
  );

  if (showArgs) {
    const snapshottedArgs = snapshot
      ? args.map((arg) => snapshotValue(arg, true))
      : args;
    console.log(
      '%cArguments:',
      `color: ${COLORS.info}; font-weight: bold;`,
      snapshottedArgs,
    );
  }

  try {
    const result = fn.apply(this, args);

    if (isThenable(result)) {
      console.groupEnd();

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Promise.resolve accepts any value
      return result
        .then((val) => {
          console.groupCollapsed(
            `%c[${level.toUpperCase()}]%c ⚡ ${name}${execId} (Resolved)`,
            `color: white; background: ${color}; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
            `color: ${COLORS.info}; font-weight: bold;`,
          );
          logSuccess(val, start);
          console.groupEnd();
          return val;
        })
        .catch((err) => {
          console.groupCollapsed(
            `%c[${level.toUpperCase()}]%c ❌ ${name}${execId} (Rejected)`,
            `color: white; background: ${color}; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
            `color: ${COLORS.error}; font-weight: bold;`,
          );
          logError(err);
          console.groupEnd();
          throw err;
        }) as Return;
    }

    logSuccess(result, start);
    console.groupEnd();
    return result;
  } catch (error) {
    logError(error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Method decorator for logging class method execution.
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Log({ level: 'info', showTime: true })
 *   getUser(id: string): User { return this.db.find(id); }
 *
 *   @Log({ level: 'error', showExecId: true })
 *   async saveUser(user: User): Promise<void> { await this.db.save(user); }
 * }
 * ```
 *
 * @param options - Logging configuration options
 * @returns Method decorator function
 * @throws Re-throws any error thrown by the decorated method
 */
export function Log(options: LogOptions = {}) {
  return function <This, Args extends unknown[], R>(
    value: (this: This, ...args: Args) => R,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => R
    >,
  ) {
    const methodName = String(context.name);
    function replacementMethod(this: This, ...args: Args): R {
      return logExecution.bind(this)(value, args, methodName, options);
    }

    return replacementMethod;
  };
}

/**
 * Wrap a standalone function with logging capabilities.
 *
 * @example
 * ```typescript
 * const fetchUser = withLog(
 *   async (id: string) => await api.getUser(id),
 *   { name: 'fetchUser', level: 'info', showTime: true }
 * );
 * await fetchUser('123');
 * ```
 *
 * @param fn - Function to wrap
 * @param options - Logging options (name is required)
 * @returns Wrapped function with logging
 * @throws Re-throws any error thrown by the wrapped function
 */
export function withLog<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  options: LogOptions & { name: string },
): (...args: Args) => Return {
  const { name, ...rest } = options;
  return (...args: Args): Return => logExecution(fn, args, name, rest);
}
/* eslint-enable no-console -- End of logger utility, re-enable console linting */
