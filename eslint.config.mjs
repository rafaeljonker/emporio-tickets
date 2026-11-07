import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const noServerFromClient = {
  group: ['@/server/*', '@/server'],
  message: 'Client code never imports the backend. Go through tRPC.',
};
const noClientFromServer = {
  group: ['@/client/*', '@/client'],
  message: 'The backend never imports UI code.',
};

export default tseslint.config(
  { ignores: ['node_modules/**', '.next/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals'),
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: dirname(fileURLToPath(import.meta.url)) } },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'react/no-danger': 'error',
      // Object shapes and unions are both written as `type`; one style is enough.
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^(?!zod$|@/shared/|@/domain/|\\./|\\.\\./).*',
          message: 'The domain is pure: it imports only zod and @/shared.',
        }],
      }],
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noServerFromClient] }] },
  },
  {
    files: ['src/server/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noClientFromServer] }] },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
);
