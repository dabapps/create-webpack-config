# Create Webpack Config

**A utility for creating webpack configs with common settings**

## About

This webpack config is designed to work as a drop-in for any Javascript or TypeScript project.

It features:

* Tree shaking
* Circular dependency checking
* Synthetic default imports (TypeScript)
* Project root alias (`^`)
* Type checking in separate worker
* Transpiling from ES6+ (and React) to target browsers
* Polyfilling ES6+ features

## Installation

```shell
npm i @dabapps/webpack-config -S
```

## Setup

### Browser support

Create a `.browserslistrc` file in the root of your project and add the following contents, adjusting as desired.

This file is used by webpack, and other tools such as autoprefixer to make our code compatible with the browsers we want to support.

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

### TypeScript config

Create a `tsconfig.json` in the root of the project and add the following contents, adjusting `include`, `paths`, and `typeRoots` as needed.

This will contain all of our base TypeScript config.

`allowSyntheticDefaultImports` and `esModuleInterop` allow us to import modules that don't have default exports as if they did, in TypeScript, so that we can be consistent across Javascript and TypeScript projects. E.g. `import React from 'react';` as opposed to `import * as React from 'react';`

You may enable type checking on Javascript files by setting `checkJs` to `true`. This can be useful if migrating a Javascript project to TypeScript.

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
    "allowJs": true,
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

Add the following scripts to your `package.json` updating paths as necessary.

```json
{
  "build-js": "webpack static/src/ts/index.tsx --config @dabapps/webpack-config --mode production -o static/build/js/bundle.js",
  "watch-js": "webpack static/src/ts/index.tsx --config @dabapps/webpack-config --mode development -o static/build/js/bundle.js --watch"
}
```
