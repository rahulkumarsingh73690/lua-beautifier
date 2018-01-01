
const toylang = {
  run(code) {
    const t = -Date.now()
    const ast = toylang.syntax.parse(code)
    const interpreted = toylang.interpreter.parse(ast)
    console.log('Duration', t + Date.now(), 'ms')
    return interpreted
  },

  syntax: require('./syntax.js'),
  interpreter: require('./interpreter.js')
}

module.exports = Object.create(toylang)
