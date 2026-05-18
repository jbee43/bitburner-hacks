import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier/flat'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: ['dist/', 'node_modules/', 'NetscriptDefinitions.d.ts*'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            'eqeqeq': 'off',
            'no-eval': 'off',
            'no-constant-condition': ['error', { checkLoops: false }],
            'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['vite.config.ts'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
)
