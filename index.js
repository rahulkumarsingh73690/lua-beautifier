
const fs = require('fs')
const path = require('path')
const filename = process.argv[3]
const code = fs.readFileSync(path.resolve(filename)).toString()
const toylang = require('./toylang/')
const syntax = toylang.syntax

let space = '    '
let repeat_spaces = 0
let log_enabled = parseInt(process.argv[2])
const props = []
log = log_enabled ? console.log : _ => 0
for(const prop in syntax) {
  const orig = syntax[prop]

  syntax[prop] = (...args) => {
    if(log_enabled) {
      var sp = space.repeat(repeat_spaces)

      log('='.repeat(100))
      props.push(prop)
      log(props.join('\t'))
      log(JSON.stringify(args, 0, 2).replace(/^(.)/gm, sp + '$1'))

      repeat_spaces++
      props.pop()
      const json_ret = JSON.stringify(ret, 0, 2)

      log(sp + 'RETURN', prop)
      if(json_ret)
        log(json_ret.replace(/^(.)/gm, sp + '$1'))
      else
        log(sp + json_ret)

      repeat_spaces--
      return ret
    } else {
      return orig(...args)
    }
  }
}

if(process.argv[2] === 'run') {
  toylang.run(filename)
} else if(process.argv[2] === 'ast') {
  console.log('Parsing...')
  const ast = toylang.syntax.parse(code)
  console.log(JSON.stringify(ast, 0, 2))
} else {
  console.log('Usage:')
  console.log(process.argv[0], process.argv[1], '[ run | ast ]', '<file.toylang>')
}
