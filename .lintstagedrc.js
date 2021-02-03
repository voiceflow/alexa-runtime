module.exports = {
  '**/*.{js,ts}': ['eslint --fix', 'prettier-eslint --write'],
  'package.json': ['fixpack'],
};
