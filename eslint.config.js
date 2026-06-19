import stylistic from '@stylistic/eslint-plugin';
import {
    defineConfigWithVueTs,
    vueTsConfigs,
} from '@vue/eslint-config-typescript';
import oxlint from 'eslint-plugin-oxlint';
import vue from 'eslint-plugin-vue';

const controlStatements = [
    'if',
    'return',
    'for',
    'while',
    'do',
    'switch',
    'try',
    'throw',
];
const paddingAroundControl = controlStatements.flatMap((stmt) => [
    { blankLine: 'always', prev: '*', next: stmt },
    { blankLine: 'always', prev: stmt, next: '*' },
]);

export default defineConfigWithVueTs(
    // ESLint owns Vue <template> rules: oxlint cannot lint template markup.
    vue.configs['flat/essential'],
    vueTsConfigs.recommended,
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            // Not a pure-formatting rule, so oxfmt does not cover it; keep it here.
            '@stylistic/padding-line-between-statements': [
                'error',
                ...paddingAroundControl,
            ],
        },
    },
    {
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'bootstrap/ssr',
            'tailwind.config.js',
            'vite.config.ts',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
    },
    // Must stay last: turns off every ESLint rule that oxlint already handles.
    ...oxlint.configs['flat/recommended'],
);
