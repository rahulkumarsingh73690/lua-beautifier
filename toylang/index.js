
const toylang = {
  run(code) {
    const ast = toylang.syntax.parse(code)
    const syntax_vars = {
      eval: function(code) {
        return toylang.interpreter.parse(toylang.syntax.parse(code), syntax_vars)
      }
    }
    const interpreted = toylang.interpreter.parse(ast, syntax_vars)
    return interpreted
  },

  syntax: require('./syntax.js'),
  interpreter: require('./interpreter.js')
}

module.exports = Object.create(toylang)
