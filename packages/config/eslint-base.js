import eslintPluginTs from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * Shared ESLint flat config base for all DevCollab v2 packages and apps.
 *
 * Usage in an app/package eslint.config.js:
 *   import base from '@devcollab/config/eslint-base.js'
 *   export default [...base]
 */

/** @type {import('eslint').Linter.FlatConfig[]} */
const base = [
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.d.ts'],
  },
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
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
]

export default base
