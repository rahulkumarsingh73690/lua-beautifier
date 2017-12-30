
const fs = require('fs')
const code = fs.readFileSync('./code.toylang').toString()

function removeEmptyLines(inst) {
  return inst.replace(/^(?:\n|\s)*/, '')
}

function ensureArray(arg) {
  return Array.isArray(arg) ? arg : []
}

function isReservedWord(word) {
  return /^(return)/.test(word)
}

// ===================================================================

const syntax = {
  parse(code) {
    let max_parses = 20
    let chunks = null
    const ignore_exps = []
    let code_remain = code

    while(max_parses--) {
      chunks = syntax.parseChunks(code_remain, ignore_exps)
      ignore_exps.pop()
      if(chunks.remain.length > 0 && chunks.parsed.args.value.length > 0) {
        code_remain = chunks.original
        ignore_exps.push(chunks.parsed.args.value[chunks.parsed.args.value.length - 1].parsed.type)
        continue
      }
      break
    }

    return chunks
  },

  parseChunks(inst, ignore_chunks) {
    ignore_chunks = ensureArray(ignore_chunks)

    const chunks = []
    let chunk = null
    let code_inst = inst
    let max_chunks = 20

    while(max_chunks--) {
      chunk = syntax.parseExpression(code_inst, ignore_chunks)
      if(!chunk)
        break

      ignore_chunks.pop()
      code_inst = chunk.remain
      chunks.push(chunk)
    }

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'chunks',
        args: {
          value: chunks
        }
      }
    }
  },

  parseExpression(inst, ignore_chunks) {
    ignore_chunks = ensureArray(ignore_chunks)
    inst = removeEmptyLines(inst)

    if(!inst)
      return false

    let exp = null

    if(!~ignore_chunks.indexOf('assign')) {
      exp = syntax.parseAssign(inst)
      if(exp)
        return exp
    }

    if(!~ignore_chunks.indexOf('math_operation')) {
      exp = syntax.parseMathOperation(inst)
      if(exp)
        return exp
    }

    if(!~ignore_chunks.indexOf('func_call')) {
      exp = syntax.parseFuncCall(inst)
      if(exp)
        return exp
    }

    if(!~ignore_chunks.indexOf('func_def')) {
      exp = syntax.parseFuncDef(inst)
      if(exp)
        return exp
    }

    if(!~ignore_chunks.indexOf('primitive')) {
      exp = syntax.parsePrimitive(inst)
      if(exp)
        return exp
    }

    if(!~ignore_chunks.indexOf('variable')) {
      exp = syntax.parseVariable(inst)
      if(exp)
        return exp
    }

    return false
  },

  parseMathOperation(inst) {
    const exp1 = syntax.parseExpression(inst, ['math_operation'])
    if(!exp1)
      return false

    exp1.remain = removeEmptyLines(exp1.remain)

    const op1 = syntax.parseMathOperator(exp1.remain)
    if(!op1)
      return false

    const exp2 = syntax.parseExpression(op1.remain, ['math_operation'])
    if(!exp2)
      return false

    exp2.remain = removeEmptyLines(exp2.remain)
    const chain = {
      original: inst,
      remain: exp2.remain,
      parsed: {
        type: 'math_operation',
        args: [
          exp1,
          op1,
          exp2
        ]
      }
    }

    let op2 = null
    let exp3 = exp2

    while(1) {
      op2 = syntax.parseMathOperator(exp3.remain)
      if(!op2)
        break

      op2.remain = removeEmptyLines(op2.remain)
      exp3 = syntax.parseExpression(op2.remain, ['math_operation'])
      if(!exp3)
        break

      chain.remain = exp3.remain = removeEmptyLines(exp3.remain)
      chain.parsed.args.push(op2, exp3)
    }

    return chain
  },

  parseMathOperator(inst) {
    if(!/^([-+*\/])/.test(inst))
      return false

    return {
      remain: inst.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'operator',
        args: {
          operator: RegExp.$1
        }
      }
    }
  },

  parsePrimitive(inst) {
    let exp = syntax.parseNumber(inst)
    if(exp)
      return exp

    return false
  },

  parseAssign(inst) {
    const v = syntax.parseVariable(inst)
    if(!v)
      return false

    const code_inst = v.remain

    if(!/^(\s*=\s*)/.test(code_inst))
      return false

    const exp = syntax.parseExpression(code_inst.substr(RegExp.$1.length))
    if(!exp)
      return false

    return {
      remain: exp.remain,
      original: inst,
      parsed: {
        type: 'assign',
        args: {
          left: v.parsed,
          right: exp.parsed
        }
      }
    }
  },

  parseVariable(inst) {
    if(!/^([a-z]+)/.test(inst))
      return false

    if(isReservedWord(RegExp.$1))
      return false

    return {
      remain: inst.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'variable',
        args: {
          value: RegExp.$1
        }
      }
    }
  },

  parseNumber(inst) {
    if(!/^(\d+)/.test(inst))
      return false

    const n = RegExp.$1
    const remain = inst.substr(n.length)

    return {
      remain: remain,
      original: inst,
      parsed: {
        type: 'number',
        args: {
          value: n
        }
      }
    }
  },

  parseFuncCall(inst) {
    const fname = syntax.parseVariable(inst)
    if(!fname)
      return false

    const fcargsc = syntax.parseFuncCallArgsChunk(fname.remain)
    if(!fcargsc)
      return false

    return {
      remain: fcargsc.remain,
      original: inst,
      parsed: {
        type: 'func_call',
        args: {
          name: fname.parsed,
          args: fcargsc.parsed
        }
      }
    }
  },

  parseFuncCallArgsChunk(inst) {
    if(!/^(\s*\(\s*)/.test(inst))
      return false

    const args = syntax.parseFuncCallArgsList(inst.substr(RegExp.$1.length))
    if(!args)
      return false

    if(!/^(\s*\)\s*)/.test(args.remain))
      return false

    return {
      remain: args.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_call_args_chunk',
        args: {
          args: args.parsed
        }
      }
    }
  },

  parseFuncCallArgsList(inst) {
    const exps = []
    let code_inst = inst
    let max_args = 20

    let exp = syntax.parseExpression(code_inst)
    if(!exp)
      return false

    exps.push(exp.parsed)

    while(max_args--) {
      code_inst = exp.remain
      if(!/^(\s*,\s*)/.test(code_inst))
        break

      exp = syntax.parseExpression(code_inst.substr(RegExp.$1.length))
      if(!exp)
        return false

      code_inst = exp.remain
      exps.push(exp.parsed)
    }

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'func_call_args',
        args: {
          exps: exps
        }
      }
    }
  },

  parseFuncDef(inst) {
    if(!/^(f\s+)/.test(inst))
      return false

    const fname = syntax.parseVariable(inst.substr(RegExp.$1.length))

    if(!fname)
      return false

    const fargs = syntax.parseFuncDefArgsChunk(fname.remain)
    if(!fargs)
      return false

    const body = syntax.parseFuncDefChunk(fargs.remain)

    if(!body)
      return false

    if(!/^(\s*\}\s*)/.test(body.remain))
      return false

    return {
      remain: body.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_def',
        args: {
          name: fname.parsed,
          args: fargs.parsed,
          body: body.parsed
        }
      }
    }
  },

  parseFuncDefArgsChunk(inst) {
    if(!/^(\s*\(\s*)/.test(inst))
      return false

    const varcs = syntax.parseFuncDefArgsList(inst.substr(RegExp.$1.length))

    if(!/^(\s*\)\s*\{\s*)/.test(varcs.remain))
      return false

    return {
      remain: varcs.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_def_args',
        args: varcs.parsed
      }
    }
  },

  parseFuncDefChunk(inst, ignore_chunks) {
    const chunks = syntax.parseChunks(inst, ignore_chunks)
    if(!chunks)
      return false

    const clean_chunks_remain = removeEmptyLines(chunks.remain)
    const ret = syntax.parseFuncDefChunkReturn(clean_chunks_remain)
    if(ret) {
      chunks.remain = ret.remain
      chunks.parsed.args.value.push(ret)
    }

    return chunks
  },

  parseFuncDefChunkReturn(inst) {
    if(!/^(return\s+)/.test(inst))
      return false

    const exp = syntax.parseExpression(inst.substr(RegExp.$1.length))
    if(!exp)
      return false

    return {
      remain: exp.remain,
      original: inst,
      parsed: {
        type: 'func_return',
        args: exp.parsed
      }
    }
  },

  parseFuncDefArgsList(inst) {
    const args = []
    let arg = null
    let code_inst = inst

    do {
      arg = syntax.parseVariable(code_inst)
      if(!arg)
        break

      code_inst = arg.remain
      args.push(arg.parsed)

      if(!/(^\s*,\s*)/.test(arg.remain))
        break

      code_inst = arg.remain.substr(RegExp.$1.length)
    } while(arg)

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'func_args',
        args: {
          args: args
        }
      }
    }
  }
}

let space = '    '
let repeat_spaces = 0
let log_enabled = 0
log = log_enabled ? console.log : _ => 0
for(const prop in syntax) {
  const orig = syntax[prop]

  syntax[prop] = (...args) => {
    var sp = space.repeat(repeat_spaces)

    log('='.repeat(100))
    log(sp + prop)
    log(JSON.stringify(args, 0, 2).replace(/^(.)/gm, sp + '$1'))

    repeat_spaces++
    const ret = orig(...args)
    const json_ret = JSON.stringify(ret, 0, 2)

    log(sp + 'RETURN', prop)
    if(json_ret)
      log(json_ret.replace(/^(.)/gm, sp + '$1'))
    else
      log(sp + json_ret)

    repeat_spaces--
    return ret
  }
}

console.log('PARSERS')
console.log(Object.keys(syntax).sort())

console.log('================================')
console.log('FILE')
console.log(code)

console.log('================================')
console.log('Parsing...')
const parsed = syntax.parse(code)
console.log('================================')
console.log('Parsed')
console.log(JSON.stringify(parsed, 0, 2))
