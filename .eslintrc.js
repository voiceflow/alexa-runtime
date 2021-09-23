module.exports = {
  extends: ['@voiceflow/eslint-config', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['@voiceflow/eslint-config/typescript'],
      rules: {
        'no-underscore-dangle': 'off',
        'no-secrets/no-secrets': 'off',
        'no-param-reassign': 'off',
        'import/no-cycle': 'off',
        'import/no-named-as-default': 'off',
        'you-dont-need-lodash-underscore/is-string': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        camelcase: 'warn',
      },
    },
  ],
};
