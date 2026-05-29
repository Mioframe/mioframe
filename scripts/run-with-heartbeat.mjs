import { spawn } from 'node:child_process';

const DEFAULT_HEARTBEAT_SECONDS = 60;
const KILL_GRACE_MS = 10_000;

const { timeoutMs, heartbeatMs, command, args } = parseArgs(process.argv.slice(2));
const startedAt = Date.now();
let lastOutputAt = startedAt;
let timedOut = false;
let killTimer = null;

console.log(
  `[heartbeat] running ${formatCommand(command, args)} with timeout ${formatDuration(timeoutMs)}`,
);

const child = spawn(command, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
});

const heartbeatTimer = setInterval(() => {
  console.log(
    `[heartbeat] still running after ${formatDuration(Date.now() - startedAt)}; last output ${formatDuration(
      Date.now() - lastOutputAt,
    )} ago`,
  );
}, heartbeatMs);

const timeoutTimer = setTimeout(() => {
  timedOut = true;
  console.error(`[heartbeat] timed out after ${formatDuration(timeoutMs)}`);
  child.kill('SIGTERM');
  killTimer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS);
}, timeoutMs);

child.stdout.on('data', (chunk) => {
  lastOutputAt = Date.now();
  process.stdout.write(chunk);
});

child.stderr.on('data', (chunk) => {
  lastOutputAt = Date.now();
  process.stderr.write(chunk);
});

child.once('error', (error) => {
  cleanupTimers();
  console.error(`[heartbeat] failed to start command: ${error.message}`);
  process.exitCode = 1;
});

child.once('close', (code, signal) => {
  cleanupTimers();

  if (timedOut) {
    process.exitCode = 124;
    return;
  }

  if (signal) {
    console.error(`[heartbeat] command exited from signal ${signal}`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});

function cleanupTimers() {
  clearInterval(heartbeatTimer);
  clearTimeout(timeoutTimer);

  if (killTimer) {
    clearTimeout(killTimer);
  }
}

function parseArgs(argv) {
  let timeoutMinutes = null;
  let heartbeatSeconds = DEFAULT_HEARTBEAT_SECONDS;
  const commandSeparatorIndex = argv.indexOf('--');

  if (commandSeparatorIndex === -1 || commandSeparatorIndex === argv.length - 1) {
    throw new Error(
      'Usage: node scripts/run-with-heartbeat.mjs --timeout-minutes <minutes> [--heartbeat-seconds <seconds>] -- <command> [...args]',
    );
  }

  for (let index = 0; index < commandSeparatorIndex; index += 1) {
    const argument = argv[index];

    if (argument === '--timeout-minutes') {
      timeoutMinutes = parsePositiveNumber(argv[index + 1], '--timeout-minutes');
      index += 1;
      continue;
    }

    if (argument === '--heartbeat-seconds') {
      heartbeatSeconds = parsePositiveNumber(argv[index + 1], '--heartbeat-seconds');
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  if (timeoutMinutes === null) {
    throw new Error('Missing required option: --timeout-minutes');
  }

  return {
    timeoutMs: timeoutMinutes * 60 * 1000,
    heartbeatMs: heartbeatSeconds * 1000,
    command: argv[commandSeparatorIndex + 1],
    args: argv.slice(commandSeparatorIndex + 2),
  };
}

function parsePositiveNumber(value, optionName) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${optionName} must be a positive number`);
  }

  return parsedValue;
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

function quoteArg(value) {
  return /^[A-Za-z0-9_./:=@-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCommand(command, args) {
  return [command, ...args].map(quoteArg).join(' ');
}
