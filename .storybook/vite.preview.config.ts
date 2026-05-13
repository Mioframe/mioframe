import { defineConfig } from 'vite';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

export default defineConfig({
  preview: {
    host: toolingConfig.localServer.host,
    port: toolingConfig.storybook.visualPreview.port,
    strictPort: toolingConfig.storybook.visualPreview.strictPort,
  },
});
