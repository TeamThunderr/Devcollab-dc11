import eslintPluginTs from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.d.ts'],
  },
  // ── TypeScript files (all workspaces) ───────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      'react-hooks': reactHooks,
    },
    rules: {
      ...eslintPluginTs.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow console only in api/lib/logger.ts — enforced via override below
      'no-console': 'warn',
    },
  },
  // ── React (web app only) ────────────────────────────────────────────────
  {
    files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  // ── API logger — console allowed here only ───────────────────────────────
  {
    files: ['apps/api/src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]
