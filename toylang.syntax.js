
const fs = require('fs')
const code = fs.readFileSync('./code.toylang').toString()

function removeEmptyLines(inst) {
  return inst.replace(/^(?:\n|\s)*/, '')
}

function ensureArray(arg) {
  return Array.isArray(arg) ? arg : []
}

function parse(code) {
  return parseChunks(code, [])
}

function parseChunks(inst, ignore_chunks) {
  ignore_chunks = ensureArray(ignore_chunks)

  const chunks = []
  let chunk = null
  let code_inst = inst
  let last_chunk = null
  let max_chunks = 20

  while(max_chunks--) {
    chunk = parseExpression(code_inst, ignore_chunks)
    if(!chunk) {
      last_chunk = chunks.length ? chunks[chunks.length - 1] : null

      if(last_chunk && code_inst.length) {
        ignore_chunks.push(last_chunk.parsed.type)
        code_inst = last_chunk.original
        chunks.pop()
        continue
      }

      break
    }

    ignore_chunks.pop()
    code_inst = chunk.remain
    chunks.push(chunk)
  }

  return {
    remain: code_inst,
    parsed: {
      type: 'chunks',
      args: {
        value: chunks
      }
    }
  }
}

function parseExpression(inst, ignore_chunks) {
  ignore_chunks = ensureArray(ignore_chunks)
  inst = removeEmptyLines(inst)

  let exp = null

  if(!~ignore_chunks.indexOf('primitive')) {
    exp = parsePrimitive(inst)
    if(exp)
      return exp
  }

  if(!~ignore_chunks.indexOf('variable')) {
    exp = parseVariable(inst)
    if(exp)
      return exp
  }

  if(!~ignore_chunks.indexOf('math_operation')) {
    exp = parseMathOperation(inst)
    if(exp)
      return exp
  }

  if(!~ignore_chunks.indexOf('assign')) {
    exp = parseAssign(inst)
    if(exp)
      return exp
  }

  if(!~ignore_chunks.indexOf('func_call')) {
    exp = parseFuncCall(inst)
    if(exp)
      return exp
  }

  if(!~ignore_chunks.indexOf('func_def')) {
    exp = parseFuncDef(inst)
    if(exp)
      return exp
  }

  return false
}

function parseMathOperation(inst) {
  
}

function parsePrimitive(inst) {
  let exp = parseNumber(inst)
  if(exp)
    return exp

  return false
}

function parseAssign(inst) {
  const v = parseVariable(inst)
  if(!v)
    return false

  inst = v.remain

  if(!/^(\s*=\s*)/.test(inst))
    return false

  const exp = parseExpression(inst.substr(RegExp.$1.length))
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
}

function parseVariable(inst) {
  if(!/^([a-z]+)/.test(inst))
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
}

function parseNumber(inst) {
  if(!/^([1-9][0-9]*)/.test(inst))
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
}

function parseFuncCall(inst) {
  if(!/^([a-z]+)/.test(inst))
    return false

  const fname = RegExp.$1

  if(!/^(\s*\(\s*)/.test(inst.substr(fname.length)))
    return false

  const open_paren = RegExp.$1
  const args = parseFuncCallArgs(inst.substr(fname.length + open_paren.length))
  if(!args)
    return false

  return {
    remain: args.remain,
    original: inst,
    parsed: {
      type: 'func_call',
      args: {
        name: fname,
        args: args.parsed
      }
    }
  }
}

function parseFuncCallArgs(inst) {
  const exps = []
  let exp = null
  let code_inst = inst
  const ignore_chunks = []
  let max_args = 20

  while(max_args--) {
    exp = parseExpression(code_inst, ignore_chunks)
    if(!exp)
      break

    if(!/(^\s*[,\)]\s*)/.test(exp.remain)) {
      console.log(exp)
      ignore_chunks.push(exp.parsed.type)
      continue
    }

    ignore_chunks.pop()
    code_inst = exp.remain.substr(RegExp.$1.length)
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
}

function parseFuncDef(inst) {
  if(!/^(f\s+)/.test(inst))
    return false

  const fname = parseVariable(inst.substr(RegExp.$1.length))

  if(!fname)
    return false

  if(!/^(\s*\(\s*)/.test(fname.remain))
    return false

  const fargs = parseFuncArgs(fname.remain.substr(RegExp.$1.length))

  if(!/^(\s*\)\s*\{\s*)/.test(fargs.remain))
    return false

  const body = parseFuncChunk(fargs.remain.substr(RegExp.$1.length))

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
}

function parseFuncChunk(inst) {
  const chunks = parseChunks(inst)
  if(!chunks)
    return false

  return chunks
}

function parseFuncArgs(inst) {
  const args = []
  let arg = null
  let code_inst = inst

  do {
    arg = parseVariable(code_inst)
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

console.log('FILE')
console.log(code)

console.log('================================')
console.log('Parsing...')
const parsed = parse(code)
console.log(JSON.stringify(parsed, 0, 2))
