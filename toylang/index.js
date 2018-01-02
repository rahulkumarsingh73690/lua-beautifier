
const toylang = {
  run(code) {
    const t = -Date.now()
    const ast = toylang.syntax.parse(code)
    const syntax_vars = {
      eval: function(code) {
        return toylang.interpreter.parse(toylang.syntax.parse(code), syntax_vars)
      }
    }
    const interpreted = toylang.interpreter.parse(ast, syntax_vars)
    console.log('Duration', t + Date.now(), 'ms')
    return interpreted
  },

  syntax: require('./syntax.js'),
  interpreter: require('./interpreter.js')
}

module.exports = Object.create(toylang)
