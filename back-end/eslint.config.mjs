export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '__tests__/',
      'load-tests/',
      'scripts/',
      'src/db/migrations/',
      'src/db/seeders/',
      'src/db/models/',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^next$' }],
      'no-console': 'off',
      'no-process-env': 'off',
    },
  },
];
