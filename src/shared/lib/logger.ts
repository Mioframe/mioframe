import { toRaw } from 'vue';
import { stringify } from 'safe-stable-stringify';
import { sessionUniqueId } from './uniqueId';
import { generateHsl } from './generateColor';
import { isPromise } from 'es-toolkit';

interface LogOptions {
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
  snapshotDepth?: number;
  snapshotBreadth?: number;
  /** Whether to show execution ID in log output. @default false */
  showExecId?: boolean;
  showTrace?: boolean;
}

/** @readonly */
const COLORS = {
  success: '#2ecc71',
  warn: '#f1c40f',
  error: '#e74c3c',
} as const;

const TAG = {
  start: '  [start]   ',
  success: '  [success] ',
  error: '[error]   ',
  trace: ' [trace]   ',
} as const;

const generateExecId = (): string => sessionUniqueId('l-');

const isThenable = (value: unknown): value is Promise<unknown> => isPromise(value);

const snapshotValue = (
  value: unknown,
  enabled: boolean,
  maximumDepth: number = 3,
  maximumBreadth = 20,
) => {
  if (!enabled) return value;
  const raw = toRaw(value);
  try {
    const str = stringify.configure({
      strict: true,
      maximumBreadth,
      maximumDepth,
    })(raw);

    return str ? JSON.parse(str) : undefined;
  } catch {
    try {
      return JSON.parse(JSON.stringify(raw));
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
  {
    showArgs = false,
    showResult = false,
    showTime = false,
    snapshot = false,
    snapshotDepth = 3,
    snapshotBreadth = 20,
    showExecId = false,
    showTrace = false,
  }: LogOptions,
): Return {
  const start = performance.now();
  const execId = showExecId ? ` #${generateExecId()}` : ' ';

  const callName = `${name}${execId}`;

  const mainColor = generateHsl(callName);

  const snapshottedArgs = showArgs
    ? snapshot
      ? args.map((arg) => snapshotValue(arg, true))
      : args
    : '...';

  const successStyles = `color: ${mainColor}; font-weight: bold;`;

  const logSuccess = (res: unknown, startTime: number) => {
    if (showResult)
      console.debug(
        `${TAG.success}%c${callName} %c(%o)%c =>`,
        successStyles,
        'color:inherit;',
        snapshottedArgs,
        `color: ${COLORS.success}; font-weight: bold;`,
        snapshotValue(res, snapshot, snapshotDepth, snapshotBreadth),
      );
    if (showTime)
      console.debug(
        '%cExecution time:',
        `color: ${COLORS.warn}; font-weight: bold;`,
        `${(performance.now() - startTime).toFixed(2)}ms`,
      );
  };

  const errorStyles = `color: ${mainColor}; font-weight: bold;`;

  const logError = (err: unknown) => {
    console.error(
      `${TAG.error}%c${callName} %c(%o)%c throw`,
      errorStyles,
      'color: inherit;',
      snapshottedArgs,
      `color: ${COLORS.error}; font-weight: bold;`,
      err,
    );
  };

  console.debug(
    `${TAG.start}%c${callName} %c(%o)`,
    successStyles,
    'color:inherit;',
    snapshottedArgs,
  );

  if (showTrace) {
    console.groupCollapsed(`${TAG.trace}%c${callName}%c ↘️`, successStyles);
    console.trace();
    console.groupEnd();
  }

  try {
    const result = fn.apply(this, args);

    if (isThenable(result)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Promise.resolve accepts any value
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
  if (!import.meta.env.DEV) {
    return function <This, Args extends unknown[], R>(fn: (this: This, ...args: Args) => R) {
      return fn;
    };
  }

  return function <This, Args extends unknown[], R>(
    value: (this: This, ...args: Args) => R,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => R>,
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
  if (!import.meta.env.DEV) {
    return fn;
  }
  const { name, ...rest } = options;
  return (...args: Args): Return => logExecution(fn, args, name, rest);
}
