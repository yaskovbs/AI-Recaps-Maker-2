// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const { allExtensions } = require('eslint-config-expo/flat/utils/extensions');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          extensions: allExtensions,
        },
        node: { extensions: allExtensions },
      },
    },
  },
]);
