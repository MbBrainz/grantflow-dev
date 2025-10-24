import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
// import prettierConfig from 'eslint-config-prettier/index.js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const config = tseslint.config(
  {
    ignores: ['.next', 'node_modules', 'out', '.vercel', 'docs', '.papi'],
  },
  {
    files: ['eslint.config.mjs', 'postcss.config.mjs'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Next.js configuration
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // TypeScript rules optimized for Claude
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': ['error'],

      // React/Next.js optimizations
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Code quality rules that align with Claude's patterns
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  }

  // Prettier integration (temporarily disabled)
  // {
  //   rules: prettierConfig.rules,
  // },
)

export default config
