const fs = require("fs")
const path = require("path")
const babylon = require("babylon")
const traverse = require("@babel/traverse").default
const { transformFromAst } = require("@babel/core")

let ID = 0

// Function to read a file and get its dependencies
const createAsset = (filename) => {
  const content = fs.readFileSync(filename, "utf-8")

  // Now we try to figure out which files this file depends on. We can do that
  // by looking at its content for import strings. However, this is a pretty
  // clunky approach, so instead, we will use a JavaScript parser.

  // JavaScript parsers are tools that can read and understand JavaScript code.
  // They generate a more abstract model called an AST (abstract syntax tree).
  const ast = babylon.parse(content, {
    sourceType: "module",
  })

  // This array will hold the relative paths of modules this module depends on.
  const dependencies = []

  traverse(ast, {
    // EcmaScript modules are fairly easy because they are static. This means
    // that you can't import a variable, or conditionally import another module.
    // Every time we see an import statement we can just count its value as a
    // dependency.
    ImportDeclaration: ({ node }) => {
      // We push the value that we import into the dependencies array.
      dependencies.push(node.source.value)
    },
  })

  // We also assign a unique identifier to this module by incrementing a simple
  // counter.
  const id = ID++

  // Get the code of the module by transforming the AST back into code.
  const { code } = transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  })

  return {
    id,
    filename,
    dependencies,
    code,
  }
}

// Extract the dependencies of every one of its dependencies
// We will keep that going until we figure out about every module
// in the application and how they depend on one another. This understanding of
// a project is called the dependency graph.
const createGraph = (entry) => {
  const mainAsset = createAsset(entry)

  // To get all the dependencies of the main asset, we will use a queue.
  const queue = [mainAsset]

  for (const asset of queue) {
    // Every one of our assets has a list of relative paths to the modules it
    // depends on. We are going to iterate over them, parse them with our
    // `createAsset()` function, and track the dependencies this module has in
    // this object.
    asset.mapping = {}

    // This is the directory this module is in.
    const dirname = path.dirname(asset.filename)

    // We iterate over the list of relative paths to its dependencies.
    asset.dependencies.forEach((relativePath) => {
      // Our `createAsset()` function expects an absolute filename. The
      // dependencies array is an array of relative paths. These paths are
      // relative to the file that imported them. We can turn the relative path
      // into an absolute one by joining it with the path to the directory of
      // the parent asset.
      const absolutePath = path.join(dirname, relativePath)

      // Parse the asset, read its content, and extract its dependencies.
      const child = createAsset(absolutePath)

      // It's essential for us to know that `asset` depends on `child`. We
      // express that relationship by adding a new property to the `mapping`
      // object with the id of the child.
      asset.mapping[relativePath] = child.id

      // Finally, we push the child asset into the queue so its dependencies
      // will also be iterated over and parsed.
      queue.push(child)
    })
  }

  return queue
}

const bundle = (graph) => {
  let modules = ""

  // For every module in the graph, we will generate a string that contains
  // the module's id, its code, and its dependencies
  graph.forEach((module) => {
    modules += `${module.id}: [
      function (require, module, exports) {
        ${module.code}
      },
      ${JSON.stringify(module.mapping)},
    ],`
  })

  // After we have all the modules, we can generate the final bundle.
  // The bundle is a self-executing function that takes an object with all the
  // modules in the graph. The function will be able to require any of the
  // modules by its id, and it will return the exports of that module.
  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports : {} };

        fn(localRequire, module, module.exports);

        return module.exports;
      }

      require(0);
    })({${modules}})
  `

  // Finally, we simply return the result
  return result
}

const graph = createGraph("./example/entry.js")
const result = bundle(graph)

console.log(result)
