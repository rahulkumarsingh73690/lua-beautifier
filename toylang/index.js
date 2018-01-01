
const toylang = {
  run(code) {
    const ast = toylang.syntax.parse(code)
    return toylang.interpreter.parse(ast)
  },

  syntax: require('./syntax.js'),
  interpreter: require('./interpreter.js')
}

module.exports = Object.create(toylang)
