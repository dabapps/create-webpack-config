# Create Webpack Config

**A utility for creating webpack configs with common settings**

## About

This utility will create a webpack config that should function as a drop-in for any Javascript or TypeScript project.

It features:

* Tree shaking
* Circular dependency checking
* Synthetic default imports (TypeScript)
* Project root alias (`^`)
* Type checking in separate worker
* Transpiling from ES6+ (and React) to target browsers
* Polyfilling ES6+ features

## Installation

Install `@dabapps/create-webpack-config`:

```shell
npm i @dabapps/create-webpack-config -S
```

Install peer dependencies (TypeScript must be at least version 2):

```shell
npm i typescript@2 webpack-cli@3 webpack@4 @babel/polyfill@7 -S
```

## Setup

### Creating your config

Create a file called `webpack.config.js` and add the following contents, adjusting options as desired.

This will bundle your `index.ts` file and all dependencies into a `bundle.js` in the `static/build/js` directory.

`webpack.config.js`
```js
const createWebpackConfig = require('@dabapps/create-webpack-config');

module.exports = createWebpackConfig({
  input: './static/src/ts/index.ts',
  outDir: './static/build/js',
  tsconfig: './tsconfig.dist.json',
  env: {
    NODE_ENV: 'production'
  }
});
```

If you require multiple bundles you can supply an object as the `input`. Files will be created in the `outDir` with names corresponding to the keys in your `input` object.

The following config will create `static/build/js/frontend-bundle.js` and `static/build/js/admin-bundle.js`.

`webpack.config.js`
```js
const createWebpackConfig = require('@dabapps/create-webpack-config');

module.exports = createWebpackConfig({
  input: {
    frontend: './static/src/ts/index.ts',
    admin: './static/src/ts/admin.ts'
  },
  outDir: './static/build/js',
  tsconfig: './tsconfig.dist.json',
  env: {
    NODE_ENV: 'production'
  }
});
```

If you would like to be able to import "raw" files as strings, you can provide a `rawFileExtensions` option, with a list of file extension that should be imported as strings e.g.

```js
{
  rawFileExtensions: ['html', 'xml', 'txt', 'csv']
}
```

If you require multiple bundles, but your source files do not both have the same parent directory, you will have to manually supply a `rootDir` option in order to use the root dir alias (`^`) e.g.

```js
{
  input: {
    frontend: './src/frontend/index.ts',
    admin: './src/admin/index.ts'
  },
  rootDir: './src'
}
```

### Browser support

Create a `.browserslistrc` file in the root of your project and add the following contents, adjusting as desired.

This file is used by webpack, and other tools such as autoprefixer to make our code compatible with the browsers we want to support.

`.browserslistrc`
```
last 10 Chrome versions
last 10 Firefox versions
last 10 Edge versions
last 10 iOS versions
last 10 Android versions
last 10 Opera versions
last 10 Safari versions
last 10 ExplorerMobile versions
Explorer >= 9
```

### TypeScript base config

Create a `tsconfig.json` in the root of the project and add the following contents, adjusting `include`, `paths`, and `typeRoots` as needed.

This will contain all of our base TypeScript config.

By default `allowJs` is set to `false`. If your project contains Javascript you should set this to `true`.

You may enable type checking on Javascript files by setting `checkJs` to `true`. This can be useful if migrating a Javascript project to TypeScript.

`allowSyntheticDefaultImports` and `esModuleInterop` allow us to import modules that don't have default exports as if they did, in TypeScript, so that we can be consistent across Javascript and TypeScript projects. E.g. `import React from 'react';` as opposed to `import * as React from 'react';`

`tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "pretty": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": false,
    "checkJs": false,
    "jsx": "react",
    "target": "es6",
    "moduleResolution": "node",
    "typeRoots": [
      "./node_modules/@types/",
      "./static/src/ts/types/"
    ],
    "baseUrl": "./",
    "paths": {
      "^*": [
        "./static/src/ts*"
      ]
    }
  },
  "include": [
    "./static/src/ts/"
  ]
}
```

### TypeScript distribution config

Create a `tsconfig.dist.json` file in the root of your project and add the following contents, adjusting `exclude`, or replacing with `include` as needed.

This is necessary to allow us to build our source without also type checking our tests or other Javascript and TypeScript files in the project.

`tsconfig.dist.json`
```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "./static/src/ts/__tests__/",
    "./static/src/ts/__mocks__/"
  ]
}
```

### Build scripts

Add the following scripts to your `package.json`.

`package.json`
```json
{
  "scripts": {
    "build-js": "webpack --mode production",
    "watch-js": "webpack --mode development --watch"
  }
}
```
