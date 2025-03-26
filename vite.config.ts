import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    build: {
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/app-list-backup.ts'),
        name: 'AppVersionController',
        fileName: (format) => `app-version-controller.${format}.js`
      },
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        // 外部依存関係の設定
        external: ['@kintone/rest-api-client'],
        output: {
          // グローバル変数として外部依存関係を提供
          globals: {
            '@kintone/rest-api-client': 'KintoneRestAPIClient'
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html']
      }
    }
  };
});