import atImport from 'postcss-import';
import presetEnv from 'postcss-preset-env';
import nested from 'postcss-nested';

const customCssUnits = (
  options = {
    baseUnit: '--base-unit',
    customUnit: 'rpx',
  },
) => {
  const baseUnit = options.baseUnit,
    customUnit = options.customUnit;
  const tester = new RegExp(`((\\d+)?\\.)?\\d+${customUnit}`, 'g');
  const postcssPlugin = 'postcss-custom-unit';
  return {
    postcssPlugin,
    Once(root) {
      root.replaceValues(
        tester,
        {
          fast: customUnit,
        },
        function (str) {
          return `calc(var(${baseUnit}) * ${parseFloat(str)})`;
        },
      );
    },
  };
};

const postcssPlugins = [
  atImport(),
  nested(),
  presetEnv(),
  customCssUnits({
    baseUnit: '--one-p',
    customUnit: 'step',
  }),
  customCssUnits({
    baseUnit: '--one-pt',
    customUnit: 'pt',
  }),
  customCssUnits({
    baseUnit: '--one-dp',
    customUnit: 'dp',
  }),
];

const config = {
  plugins: postcssPlugins,
};

export default config;
