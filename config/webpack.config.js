const { EnvironmentPlugin } = require('webpack');
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  performance: {
    hints: false,
  },
  stats: {
    timings: true,
  },
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    'raf/polyfill',
    path.resolve(__dirname, 'static/src/ts/index.tsx'),
  ],
  module: {
    rules: [
      {
        test: /\.(?:html|txt|xml)$/,
        use: 'raw-loader',
      },
      {
        test: /\.[tj]sx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                [
                  'env',
                  {
                    modules: false,
                  },
                ],
              ],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        include: path.resolve(__dirname, 'static/src/ts'),
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '^': path.resolve(__dirname, 'static/src/ts'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'static/build/js/'),
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new CircularDependencyPlugin({
      failOnError: true,
      exclude: /node_modules/,
      cwd: process.cwd(),
    }),
    new EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};
