module.exports = {
  extends: ['@voiceflow/eslint-config'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['@voiceflow/eslint-config/typescript'],
      rules: {
        'max-len': [
          'error',
          {
            code: 120,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
          },
        ],
        'no-underscore-dangle': 'off',
        'no-secrets/no-secrets': 'off',
        'no-param-reassign': 'off',
        'import/no-cycle': 'off',
        'import/no-named-as-default': 'off',
        'you-dont-need-lodash-underscore/is-string': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        camelcase: 'off',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
        'class-methods-use-this': 'off',
      },
    },
  ],
};
