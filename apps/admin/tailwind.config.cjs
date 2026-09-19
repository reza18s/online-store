const rootConfig = require('../../tailwind.config.cjs');

module.exports = {
  ...rootConfig,
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
