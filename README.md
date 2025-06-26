# MiniPack

A minimal JavaScript bundler built from scratch.

### Introduction

Bundlers are mainly used in frontend development tools like Metro, Vite, and Webpack are common examples. However, many developers don’t fully understand how bundlers work or even realize they’re using one.

A bundler compiles modern JavaScript (like ES6 modules) into older, browser-compatible JavaScript. It also bundles multiple files and their dependencies into a single file that the browser can run.

This project was created to help me better understand what a bundler is, how it works under the hood, and to build a simplified version of one myself.

### Try it

1. **Clone this repo**

```sh
$ git clone https://github.com/koalacapek/minipack.git
```

2. **Install dependencies**

```sh
$ npm install
```

3. **Run the bundler**

Make sure you have [node](https://nodejs.org/en/download) installed, then run:

```sh
$ node src/minipack.js
```

3. **Play around**

You can modify or add files in the **`example/`** folder to test how the bundler picks up and resolves dependencies.
