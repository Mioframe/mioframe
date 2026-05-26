import { spawn } from 'node:child_process';
import { join } from 'node:path';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const mode = process.argv[2];

if (mode !== 'dev' && mode !== 'build') {
  console.error('Expected Storybook mode: dev or build.');
  process.exit(1);
}

const args =
  mode === 'dev'
    ? [
        join(process.cwd(), 'node_modules', '.bin', 'storybook'),
        'dev',
        '-p',
        String(toolingConfig.storybook.devServer.port),
        '--host',
        toolingConfig.localServer.host,
      ]
    : [
        join(process.cwd(), 'node_modules', '.bin', 'storybook'),
        'build',
        '--output-dir',
        toolingConfig.storybook.staticDir,
      ];

const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  env: {
    ...process.env,
    APP_STORYBOOK: '1',
    STORYBOOK_DISABLE_TELEMETRY: '1',
  },
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
