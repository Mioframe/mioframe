import { spawn } from 'node:child_process';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const mode = process.argv[2];

if (mode !== 'dev' && mode !== 'build') {
  console.error('Expected Storybook mode: dev or build.');
  process.exit(1);
}

const args =
  mode === 'dev'
    ? [
        'storybook',
        'dev',
        '-p',
        String(toolingConfig.storybook.devServer.port),
        '--host',
        toolingConfig.localServer.host,
      ]
    : ['storybook', 'build', '--output-dir', toolingConfig.storybook.staticDir];

const child = spawn(args.join(' '), {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BEAVER_STORYBOOK: '1',
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
