const { EnvironmentPlugin } = require('webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const CWD = process.cwd();
const POLYFILLS = [require.resolve('raf/polyfill')];
const MATCHES_LEADING_DOT = /^\./;

const BABEL_BASE_PRESETS = [
  [
    require.resolve('@babel/preset-env'),
    {
      modules: false,
      useBuiltIns: 'usage',
      corejs: { version: 3 },
    },
  ],
  require.resolve('@babel/preset-react'),
];

const BABEL_BASE_PLUGINS = [
  require.resolve('@babel/plugin-proposal-class-properties'),
  require.resolve('@babel/plugin-proposal-object-rest-spread'),
];

const BABEL_TYPESCRIPT_PRESETS = BABEL_BASE_PRESETS.concat(
  require.resolve('@babel/preset-typescript')
);
const BABEL_TYPESCRIPT_PLUGINS = BABEL_BASE_PLUGINS.concat(
  require.resolve('babel-plugin-const-enum')
);

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

  if (!options.tsconfig || typeof options.tsconfig !== 'string') {
    throw new Error('Invalid "tsconfig" in config options - must be a string');
  }

  if (
    (typeof options.env !== 'object' && typeof options.env !== 'undefined') ||
    (typeof options.env === 'object' && !options.env) ||
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

  if (
    typeof options.rootDir !== 'string' &&
    typeof options.rootDir !== 'undefined'
  ) {
    throw new Error('Invalid "rootDir" options - must be a string');
  }

  if (typeof options.rootDir === 'string' && !options.rootDir) {
    throw new Error('Invalid "rootDir" option - cannot be an empty string');
  }

  if (
    typeof options.include !== 'undefined' &&
    !(typeof options.include === 'string' || Array.isArray(options.include))
  ) {
    throw new Error('Invalid "include" option - must be a string or array');
  }

  if (typeof options.include === 'string' && !options.include) {
    throw new Error('Invalid "include" option - cannot be an empty string');
  }

  if (Array.isArray(options.include) && !options.include.length) {
    throw new Error('Invalid "include" option - cannot be an empty array');
  }
}

function createEntry(options) {
  if (typeof options.input === 'string') {
    return POLYFILLS.concat(path.resolve(CWD, options.input));
  }

  const entry = {};

  Object.keys(options.input).forEach(key => {
    entry[key] = POLYFILLS.concat(path.resolve(CWD, options.input[key]));
  });

  return entry;
}

function getRootDir(options) {
  if (typeof options.rootDir === 'string') {
    return path.resolve(CWD, options.rootDir);
  }

  if (typeof options.input === 'string') {
    return path.dirname(path.resolve(CWD, options.input));
  }

  const dirs = [];

  Object.keys(options.input).forEach(key => {
    const dir = path.dirname(path.resolve(CWD, options.input[key]));

    if (dirs.length && dirs.indexOf(dir) < 0) {
      throw new Error(
        'More than one possible root directory - please specify a "rootDir" option'
      );
    }

    dirs.push(dir);
  });

  return dirs[0];
}

function getIncludeDirs(options) {
  const includes = []
    .concat(options.include || [])
    .map(include => path.resolve(CWD, include));

  if (typeof options.input === 'string') {
    return includes.concat(path.dirname(path.resolve(CWD, options.input)));
  }

  const dirs = [];

  Object.keys(options.input).forEach(key => {
    const dir = path.dirname(path.resolve(CWD, options.input[key]));

    if (dirs.indexOf(dir) < 0) {
      dirs.push(dir);
    }
  });

  return includes.concat(dirs);
}

function createFileExtensionRegex(options) {
  const joinedExtensions = options.rawFileExtensions
    .map(extension => {
      return extension.trim().replace(MATCHES_LEADING_DOT, '');
    })
    .join('|');

  return new RegExp(`\\.(?:${joinedExtensions})\$`);
}

function createWebpackConfig(options) {
  validateOptions(options);

  const entry = createEntry(options);
  const rootDir = getRootDir(options);
  const includeDirs = getIncludeDirs(options);
  const outFile =
    typeof options.input === 'string' ? 'bundle.js' : '[name]-bundle.js';
  const outDir = path.resolve(CWD, options.outDir);

  const rules = [
    (options.rawFileExtensions || []).length
      ? {
          test: createFileExtensionRegex(options),
          use: require.resolve('raw-loader'),
        }
      : null,
    {
      test: /\.jsx?$/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            presets: BABEL_BASE_PRESETS,
            plugins: BABEL_BASE_PLUGINS,
          },
        },
      ],
      include: includeDirs,
    },
    {
      test: /\.tsx?$/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            presets: BABEL_TYPESCRIPT_PRESETS,
            plugins: BABEL_TYPESCRIPT_PLUGINS,
          },
        },
      ],
      include: includeDirs,
    },
  ].filter(rule => Boolean(rule));

  const typeCheckerPlugins = options.skipTypeChecking
    ? []
    : [
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            configFile: path.resolve(process.cwd(), options.tsconfig),
          },
        }),
      ];

  const circularDependencyPlugins = options.skipCircularDependencyChecking
    ? []
    : [
        new CircularDependencyPlugin({
          failOnError: true,
          exclude: /node_modules/,
          cwd: CWD,
        }),
      ];

  return {
    performance: {
      hints: false,
    },
    stats: 'errors-warnings',
    devtool: 'source-map',
    entry,
    output: {
      filename: outFile,
      path: outDir,
    },
    module: {
      rules,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '^': rootDir,
      },
    },
    plugins: [
      ...typeCheckerPlugins,
      ...circularDependencyPlugins,
      new EnvironmentPlugin(options.env || {}),
    ],
  };
}

module.exports = createWebpackConfig;
