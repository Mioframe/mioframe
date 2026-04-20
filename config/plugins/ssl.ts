import type { PluginOption } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

type GetSslPluginsParams = {
  isPreview: boolean;
  mode: string;
};

export const getSslPlugins = ({ isPreview, mode }: GetSslPluginsParams): PluginOption[] =>
  mode === 'development' || isPreview ? [basicSsl()] : [];
