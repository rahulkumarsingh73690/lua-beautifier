
const path = require('path')
const fs = require('fs')
const modules_cache = {}

function readfile(filename) {
  return fs.readFileSync(path.resolve(filename), 'utf-8').toString()
}

const toylang = {
  run(filename) {
    const code = readfile(filename)
    const ast = toylang.syntax.parse(code)

    const syntax_vars = {
      eval: function(code) {
        return toylang.interpreter.parse(toylang.syntax.parse(code), syntax_vars)
      }
    }

    const scope = Object.assign({}, syntax_vars)
    scope.filename = filename
    return toylang.interpreter.parse(ast, scope)
  },

  syntax: require('./syntax.js'),
  interpreter: require('./interpreter.js')
}

module.exports = Object.create(toylang)
