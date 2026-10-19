import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default defineConfig(
  { ignores: ['dist', 'playwright-report', 'test-results', 'guide/.vitepress/cache'] },
  js.configs.recommended,
  ts.configs.strict,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    // __BUILD__ is set at build time (vite.config.ts, src/globals.d.ts).
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __BUILD__: 'readonly',
        __VERSION__: 'readonly',
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: { parser: ts.parser, extraFileExtensions: ['.svelte'], svelteConfig },
    },
  },
  {
    // Tests index into fixtures they just built; `!` is clearer there than guards.
    files: ['**/*.test.ts', 'tests/**/*.ts', 'guide/*.spec.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    // Exports are the code's reference documentation (CONTRIBUTING › Documentation).
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ClassDeclaration: true },
          contexts: ['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'VariableDeclaration'],
        },
      ],
    },
  },
);
