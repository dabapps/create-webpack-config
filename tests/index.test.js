const path = require('path');
const createWebpackConfig = require('../src');

const CWD = process.cwd();

jest.mock('webpack', () => ({
  EnvironmentPlugin: jest.fn(),
}));
jest.mock('circular-dependency-plugin', () => jest.fn());
jest.mock('fork-ts-checker-webpack-plugin', () => jest.fn());

const { EnvironmentPlugin } = require('webpack');

describe('createWebpackConfig', () => {
  it('should be a function', () => {
    expect(typeof createWebpackConfig).toBe('function');
  });

  it('should return a webpack config object', () => {
    expect(
      typeof createWebpackConfig({
        input: 'src/index.ts',
        outDir: 'dist',
        tsconfig: 'tsconfig.json',
      })
    ).toBe('object');
  });

  it('should bundle a single entry', () => {
    const config = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
    });

    expect(config.entry).toEqual([
      'babel-polyfill',
      'raf/polyfill',
      path.resolve(CWD, 'src/index.ts'),
    ]);

    expect(config.output).toEqual({
      filename: 'bundle.js',
      path: path.resolve(CWD, 'dist'),
    });

    expect(config.resolve.alias).toEqual({
      '^': path.resolve(CWD, 'src/'),
    });
  });

  it('should bundle multiple entries', () => {
    const config = createWebpackConfig({
      input: {
        frontend: 'src/index.ts',
        admin: 'src/admin.ts',
      },
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
    });

    expect(config.entry).toEqual({
      frontend: [
        'babel-polyfill',
        'raf/polyfill',
        path.resolve(CWD, 'src/index.ts'),
      ],
      admin: [
        'babel-polyfill',
        'raf/polyfill',
        path.resolve(CWD, 'src/admin.ts'),
      ],
    });

    expect(config.output).toEqual({
      filename: '[name]-bundle.js',
      path: path.resolve(CWD, 'dist'),
    });

    expect(config.resolve.alias).toEqual({
      '^': path.resolve(CWD, 'src/'),
    });

    expect(config.module.rules[config.module.rules.length - 1].include).toEqual(
      path.resolve(CWD, 'src/')
    );
  });

  it('should error if multiple entries are in different directories', () => {
    const unsureAboutAliases = () =>
      createWebpackConfig({
        input: {
          frontend: 'src/index.ts',
          admin: 'admin/index.js',
        },
        outDir: 'dist',
        tsconfig: 'tsconfig.json',
      });

    expect(unsureAboutAliases).toThrow(/rootDir/);
  });

  it('should create rules without raw files if no extensions provided', () => {
    const config1 = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
    });

    const config2 = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
      rawFileExtensions: [],
    });

    expect(config1.module.rules.length).toBe(1);
    expect(config1.module.rules[0].use[0].loader).toBe('babel-loader');

    expect(config2.module.rules.length).toBe(1);
    expect(config2.module.rules[0].use[0].loader).toBe('babel-loader');
  });

  it('should create a regex for raw files', () => {
    const config = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
      rawFileExtensions: ['html', 'txt', 'xml', 'csv'],
    });

    const rawLoaderRule = config.module.rules[0];

    expect(typeof rawLoaderRule).toBe('object');
    expect(rawLoaderRule.use).toBe('raw-loader');
    expect(rawLoaderRule.test).toEqual(/\.(?:html|txt|xml|csv)$/);
  });

  it('should set the tsconfig path', () => {
    const config = createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
    });

    const tsLoaderRule =
      config.module.rules[config.module.rules.length - 1].use[1];

    expect(typeof tsLoaderRule).toBe('object');
    expect(tsLoaderRule.loader).toBe('ts-loader');
    expect(tsLoaderRule.options).toEqual({
      transpileOnly: true,
      configFile: path.resolve(CWD, 'tsconfig.json'),
    });
  });

  it('should work without environment variables', () => {
    createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
    });

    expect(EnvironmentPlugin).toHaveBeenCalledWith({});
  });

  it('should set default environment variables', () => {
    createWebpackConfig({
      input: 'src/index.ts',
      outDir: 'dist',
      tsconfig: 'tsconfig.json',
      env: {
        NODE_ENV: 'production',
      },
    });

    expect(EnvironmentPlugin).toHaveBeenCalledWith({
      NODE_ENV: 'production',
    });
  });
});
