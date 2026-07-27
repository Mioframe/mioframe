const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const logDirectory = '.verify/logs';
const logPath = `${logDirectory}/correction.log`;
fs.mkdirSync(logDirectory, { recursive: true });
fs.writeFileSync(logPath, '# verify and PR workflow correction\n', 'utf8');

function run(label, command, args) {
  fs.appendFileSync(logPath, `\n## ${label}\n$ ${[command, ...args].join(' ')}\n`, 'utf8');
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.stdout) {
    fs.appendFileSync(logPath, `\nstdout:\n${result.stdout}`, 'utf8');
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    fs.appendFileSync(logPath, `\nstderr:\n${result.stderr}`, 'utf8');
    process.stderr.write(result.stderr);
  }

  fs.appendFileSync(
    logPath,
    `\nstatus: ${String(result.status)}\nsignal: ${String(result.signal)}\n`,
    'utf8',
  );

  if (result.error) {
    fs.appendFileSync(logPath, `error: ${result.error.stack ?? result.error.message}\n`, 'utf8');
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }

  return true;
}

if (!run('apply correction', process.execPath, ['scripts/applyVerifyAndPrRulesCorrection.cjs'])) {
  return;
}

if (!run('normalize generated files', 'pnpm', ['verify', '--fix-only'])) {
  return;
}

run('publish correction', process.execPath, ['scripts/pushVerifyAndPrRulesCorrection.cjs']);
