const createWebpackConfig = require('./src');

module.exports = createWebpackConfig({
  input: './test-files/src/index.ts',
  outDir: './test-files/build/js',
  tsconfig: './tsconfig.json',
  env: {
    NODE_ENV: 'production',
  },
});
