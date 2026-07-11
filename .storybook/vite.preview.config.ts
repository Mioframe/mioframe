import { defineConfig } from 'vite';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

export default defineConfig({
  preview: {
    host: toolingConfig.localServer.host,
    port: toolingConfig.storybook.testPreview.port,
    strictPort: toolingConfig.storybook.testPreview.strictPort,
  },
});
