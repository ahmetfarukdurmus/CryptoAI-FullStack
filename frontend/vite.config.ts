import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// React Native .web.* uzantılarını öncelikli çözen eklenti
const reactNativeWebResolver = () => ({
  name: 'react-native-web-resolver',
  enforce: 'pre' as const,
  resolveId(source: string, importer: string | undefined) {
    if (!importer) return null;
    if (!source.startsWith('.') && !source.startsWith('/') && !source.includes('/')) return null;

    const dir = path.dirname(importer);
    const candidate = path.resolve(dir, source);

    const webExtensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js'];
    for (const ext of webExtensions) {
      if (fs.existsSync(candidate + ext)) {
        return candidate + ext;
      }
    }
    return null;
  },
});

export default defineConfig({
  plugins: [reactNativeWebResolver(), react()],
  resolve: {
    alias: [
      {
        find: /^react-native-svg$/,
        replacement: path.resolve(__dirname, './node_modules/react-native-svg/lib/module/elements.web.js'),
      },
      {
        find: /react-native-svg\/lib\/module\/lib\/resolve/,
        replacement: path.resolve(__dirname, './src/shims/svgResolve.js'),
      },
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent/,
        replacement: path.resolve(__dirname, './src/shims/codegenNativeComponent.js'),
      },
      {
        find: /^react-native\/Libraries\/ReactNative\/AppContainer/,
        replacement: path.resolve(__dirname, './src/shims/AppContainer.js'),
      },
      {
        find: /^react-native$/,
        replacement: path.resolve(__dirname, './src/shims/reactNativeWeb.js'),
      },
      {
        find: '@react-native/assets-registry/registry',
        replacement: path.resolve(__dirname, './src/shims/assetsRegistry.js'),
      },
      {
        find: '@react-native/assets-registry',
        replacement: path.resolve(__dirname, './src/shims/assetsRegistry.js'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(true),
  },
  server: {
    port: 3000,
    open: true,
  },
});
