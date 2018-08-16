const { EnvironmentPlugin } = require('webpack');
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const CWD = process.cwd();
const POLYFILLS = ['babel-polyfill', 'raf/polyfill'];
const MATCHES_LEADING_DOT = /^./;

function validateOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid config options - must be an object');
  }

  if (!('input' in options)) {
    throw new Error('No "input" in config options');
  }

  if (
    !options.input ||
    (typeof options.input !== 'string' && typeof options.input !== 'object') ||
    Array.isArray(options.input)
  ) {
    throw new Error(
      'Invalid "input" option - must be a string or keyed object'
    );
  }

  if (typeof options.input === 'object' && !Object.keys(options.input).length) {
    throw new Error('No keys in "input" option');
  }

  if (!('outDir' in options)) {
    throw new Error('No "outDir" in config options');
  }

  if (!options.outDir || typeof options.outDir !== 'string') {
    throw new Error('Invalid "outDir" option - must be a string');
  }

  if (!('tsconfig' in options)) {
    throw new Error('No "tsconfig" in config options');
  }

  if (!('env' in options)) {
    throw new Error('No "env" in config options');
  }

  if (
    !options.env ||
    typeof options.env !== 'object' ||
    Array.isArray(options.env)
  ) {
    throw new Error('Invalid "env" option - must be a keyed object');
  }

  if (
    !(
      Array.isArray(options.rawFileExtensions) ||
      typeof options.rawFileExtensions === 'undefined'
    )
  ) {
    throw new Error('Invalid "rawFileExtensions" option - must be an array');
  }
}

function createEntry(options) {
  if (typeof options.input === 'string') {
    return POLYFILLS.concat(path.resolve(CWD, options.input));
  }

  const entry = {};

  Object.keys(options.input).forEach((key) => {
    entry[key] = POLYFILLS.concat(path.resolve(CWD, options.input[key]));
  });

  return entry;
}

function createFileExtensionRegex(options) {
  const joinedExtensions = options.rawFileExtensions.map((extension) => {
    return extension.trim().replace(MATCHES_LEADING_DOT, '');
  }).join('|');

  return new RegExp(`\\.(?:${joinedExtensions})\$`);
}

function createWebpackConfig(options) {
  validateOptions(options);

  const entry = createEntry(options);
  const outFile = Array.isArray(entry) ? 'bundle.js' : '[name]-bundle.js';
  const outDir = path.resolve(CWD, options.outDir);
  const rawTestRegex = createFileExtensionRegex(options);

  return {
    performance: {
      hints: false,
    },
    stats: {
      timings: true,
    },
    devtool: 'source-map',
    entry,
    output: {
      filename: outFile,
      path: outDir,
    },
    module: {
      rules: [
        {
          test: rawTestRegex,
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
                configFile: path.resolve(CWD, options.tsconfig)
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
}

module.exports = createWebpackConfig;
