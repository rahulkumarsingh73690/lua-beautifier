
const https = require('https')
const http = require('http')
const fs = require('fs')
const util = require('util')
const path = require('path')

function ensureObject(obj) {
  return obj && typeof(obj) === 'object' ? obj : {}
}

function inheritGlobalScope(obj) {
  return Object.assign(Object.create(global_scope), ensureObject(obj))
}

const isExtensible = (function isExtensible(exp) {
  const extensible = 'func_call variable primitive'.split(' ')
  return function isExtensible(exp) {
    return !!~extensible.indexOf(exp && exp.type)
  }
})()

const valid_iters = 'map filter reduce'.split(' ')
function iter(iter_name, subject, callback, init) {
  if(!(typeof(callback) === 'function'))
    return []

  if(~valid_iters.indexOf(iter_name)) {
    if(Array.isArray(subject))
      return subject[iter_name](function(item, index) {
        return callback(item, index)
      })

    if(subject && typeof(subject) === 'object') {
      const keys = Object.keys(subject)
      return keys[iter_name](function(key) {
        return callback(subject[key], key)
      }, init)
    }

    throw new TypeError(iter_name + ' accepts only arrays or objects.')
  }

  throw new Error('Interpreter error (iter): ' + iter_name)
}

function request(protocol) {
  return function(options, callback) {
    const cb = (function() {
      let result = 0
      return function(error, data) {
        if(result) return false
        result = 1
        return callback(error, data)
      }
    })()

    try {
      const request = protocol.request(options, function(response) {
        let data = ''
        response.setEncoding('utf-8')
        response.on('error', function(error) {
          cb(0, data)
        })
        response.on('data', buffer => data += buffer)
        response.on('end', function() {
          cb(0, data)
        })
      })
      request.end()
      request.on('error', function(error) {
        cb(error, 0)
      })
    } catch(error) {
      cb(error, 0)
      return false
    }

    return true
  }
}

function http_server(protocol) {
  return function(options) {
    options = {
      request: options.request,
      server: options.server
    }

    const server = http.createServer(function(request, response) {
      try {
        let data = ''
        request.setEncoding('utf-8')
        request.on('data', function(buffer) { data += buffer })
        request.on('end', function() {
          response.end(options.request.reply(request, data))
        })
      } catch(error) {
        response.end(options.request.onerror(error, request))
      }
    })
    server.timeout = 0
    server.on('error', options.server.onerror)
    server.listen(options.server.port, function() {
      options.server.oncreate(options)
    })

    return server
  }
}

const global_scope = {
  // global
  print: console.log.bind(console),
  type: function(value) {
    return Array.isArray(value) ? 'array' : typeof value
  },

  // json
  json2obj: function(json, callback) {
    try {
      return callback(0, JSON.parse(json))
    } catch(error) {
      return callback(error, 0)
    }
  },

  obj2json: function(obj, callback) {
    try {
      return callback(0, JSON.stringify(obj))
    } catch(error) {
      return callback(error, 0)
    }
  },

  // net
  https_request: request(https),
  http_request: request(http),
  http_server: http_server(http),

  // disk file
  file_read: function(full_path, callback) {
    try {
      full_path = path.resolve(full_path)
      fs.readFile(full_path, 'utf-8', function(error, data) {
        if(error)
          callback(error, 0)
        else
          callback(0, {data: data.toString(), full_path})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },
  file_write: function(full_path, data, callback) {
    try {
      full_path = path.resolve(full_path)
      fs.writeFile(full_path, data, function(error, data) {
        if(error)
          callback(error, 0)
        else
          callback(0, {full_path})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },
  file_delete: function(full_path, callback) {
    try {
      full_path = path.resolve(full_path)
      fs.unlink(full_path, function(error, data) {
        if(error)
          callback(error, 0)
        else
          callback(0, {full_path})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },
  file_append: function(full_path, data, callback) {
    try {
      full_path = path.resolve(full_path)
      fs.appendFile(full_path, data, function(error, data) {
        if(error)
          callback(error, 0)
        else
          callback(0, {full_path})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },

  // disk dir
  dir_create: function(dir, callback) {
    try {
      dir = path.resolve(dir)
      fs.mkdir(dir, function(error, content) {
        if(error)
          callback(error, 0)
        else
          callback(0, {dir})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },
  dir_delete: function(dir, callback) {
    try {
      dir = path.resolve(dir)
      fs.rmdir(dir, function(error, content) {
        if(error)
          callback(error, 0)
        else
          callback(0, {dir})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },
  dir_read: function(dir, callback) {
    try {
      dir = path.resolve(dir)
      fs.readdir(dir, function(error, content) {
        if(error)
          callback(error, 0)
        else
          callback(0, {dir})
      })
      return true
    } catch(error) {
      callback(error, 0)
      return false
    }
  },

  // loop
  map: function(callback, array) {
    return iter('map', array, callback)
  },
  reduce: function(callback, array, init) {
    return iter('reduce', array, callback, init)
  },
  filter: function(callback, array) {
    return iter('filter', array, callback)
  },

  // array
  length: function(subject) {
    return typeof(subject) === 'string' || Array.isArray(subject) ? subject.length : 0
  },

  // object
  obj_keys: function(object) {
    return object && typeof(object) === 'object' ? Object.keys(object) : []
  },

  // string
  str_starts_with: function(string, starts_with) {
    return string.startsWith(starts_with)
  },
  str_ends_with: function(string, starts_with) {
    return string.endsWith(starts_with)
  },
  str_slice: function(string, start, end) {
    return string.slice(start, end)
  },
  str_char2code: function(char) {
    return char.charCodeAt(0)
  },
  str_code2char: function(code) {
    return String.fromCharCode(code)
  },
  str_repeat: function(string, amount) {
    return string.repeat(amount)
  },
  str_index: function(string, find) {
    return string.indexOf(find)
  },
  str_contains: function(string, find) {
    return !!~string.indexOf(find)
  }
}

const interpreter = {
  parse(ast, scope, options) {
    options = {
      old_scope: options && options.old_scope
    }
    scope = options.old_scope ? scope : inheritGlobalScope(scope)
    let ret = void 0

    return ast.parsed.args.value.reduce(function(acc, chunk, index) {
      if(acc && typeof(acc) === 'object' && 'ret' in acc)
        return acc

      else if(chunk.parsed) {
        ret = interpreter.intExpression(chunk.parsed, scope)

        if(chunk.parsed.type === 'func_return')
          return {
            ret: ret
          }

        return ret

      } else
        throw new Error('Interpreter error (parse): ' + chunk.parsed.type)
    }, ret)
  },

  intDeclIf(ast, scope) {
    const cond_ret = interpreter.intCondBlock(ast.args.cond_block, scope)
    const parse_options = {old_scope: true}

    if(cond_ret)
      return interpreter.parse({parsed: ast.args.if_chunk.args}, scope, parse_options)

    if(ast.args.else_block.args.else_middles.length > 0) {
      const else_middle_ret = interpreter.intDeclIfElseMiddle(ast.args.else_block.args.else_middles, scope)
      if(else_middle_ret && 'data' in else_middle_ret)
        return else_middle_ret.data
    }

    if(ast.args.else_block.args.else_end)
      return interpreter.parse({parsed: ast.args.else_block.args.else_end.args.args}, scope, parse_options)
  },

  intDeclIfElseMiddle(ast, scope) {
    const parse_options = {old_scope: true}
    return ast.reduce(function(acc, ast) {
      if(acc && acc.data) return acc;

      const cond_ret = interpreter.intCondBlock(ast.args.cond, scope)
      if(cond_ret)
        return {
          data: interpreter.parse({parsed: ast.args.block.args}, scope, parse_options)
        }
    }, false)
  },

  intCondBlock(ast, scope) {
    const ops = []
    const exps = []

    ast.args.value.parsed.args.forEach(function(arg, index) {
      if(index & 1)
        ops.push(arg)
      else
        exps.push(interpreter.intExpression(arg, scope))
    })

    return ops.reduce(function(acc, op, index) {
      const exp = exps[index + 1]

      if(op.args.value === '<')
        return interpreter.intLogOpLT(acc, exp)

      else if(op.args.value === '>')
        return interpreter.intLogOpGT(acc, exp)

      else if(op.args.value === '==')
        return interpreter.intLogOpEQ(acc, exp)

      else if(op.args.value === '!=')
        return interpreter.intLogOpNEQ(acc, exp)

      else if(op.args.value === '>=')
        return interpreter.intLogOpGTE(acc, exp)

      else if(op.args.value === '<=')
        return interpreter.intLogOpLTE(acc, exp)

      else if(op.args.value === '&&')
        return interpreter.intLogOpAND(acc, exp)

      else if(op.args.value === '||')
        return interpreter.intLogOpOR(acc, exp)

      else
        throw new Error('Interpreter error (intCondBlock): ' + op.args.value)
    }, exps[0])
  },

  intLogOpAND(val1, val2) {
    return val1 && val2;
  },

  intLogOpOR(val1, val2) {
    return val1 || val2;
  },

  intLogOpLTE(val1, val2) {
    return val1 <= val2;
  },

  intLogOpGTE(val1, val2) {
    return val1 >= val2;
  },

  intLogOpNEQ(val1, val2) {
    return val1 !== val2;
  },

  intLogOpLT(val1, val2) {
    return val1 < val2;
  },

  intLogOpGT(val1, val2) {
    return val1 > val2;
  },

  intLogOpEQ(val1, val2) {
    return val1 === val2;
  },

  intFuncDef(ast, scope) {
    return scope[ast.args.name.args.value] = function() {
      const values = Array.from(arguments)
      const inner_scope = inheritGlobalScope(scope)

      if(ast.args.args.args.args.args.length !== values.length)
        throw new TypeError(`"${ast.args.args.args.args.args.length}" arguments are expected but "${values.length}" were provided.`)

      values.forEach(function(value, index) {
        const var_name = ast.args.args.args.args.args[index].args.value
        inner_scope[var_name] = value
      })

      const ret = interpreter.parse({parsed: ast.args.body}, inner_scope)
      return ret && 'ret' in ret ? ret.ret : ret
    }
  },

  intFuncReturn(ast, scope) {
    return interpreter.intExpression(ast.args, scope)
  },

  intAssign(ast, scope) {
    if(ast.args.left.exts.length > 0) {
      let obj = ast.args.left.exts.slice(0, -1).reduce(function(acc, ext, index) {
        if(ext.type === 'extend_object') {
          return acc[ext.args.args.value]

        } else if(ext.type === 'extend_computed') {
          return acc[interpreter.intExpression(ext.args, scope)]

        } else
          throw new Error('Interpreter error (intAssign): ' + ext.type)
      }, scope[ast.args.left.args.value])

      const last_ext = ast.args.left.exts.slice(-1)[0]
      if(last_ext.type === 'extend_object')
        return obj[last_ext.args.args.value] = interpreter.intExpression(ast.args.right, scope)
      else if(last_ext.type === 'extend_computed')
        return obj[interpreter.intExpression(last_ext.args, scope)] = interpreter.intExpression(ast.args.right, scope)
      else
        throw new Error('Interpreter error (intAssign): ' + last_ext.type)

    } else
      return scope[ast.args.left.args.value] = interpreter.intExpression(ast.args.right, scope)
  },

  intFuncCall(ast, scope) {
    if(!(ast.args.name.args.value in scope))
      throw new ReferenceError(`"${ast.args.name.args.value}" is not defined`)

    const func = scope[ast.args.name.args.value]
    if(typeof(func) !== 'function')
      throw new TypeError(`"${ast.args.name.args.value}" is not a function`)

    const exps = interpreter.intFuncCallArgsChunk(ast.args.args, scope)
    return func.apply(null, exps)
  },

  intFuncCallArgsChunk(ast, scope) {
    return interpreter.intFuncCallArgs(ast.args, scope)
  },

  intFuncCallArgs(ast, scope) {
    return ast.args.exps.map(function(exp) {
      return interpreter.intExpression(exp, scope)
    })
  },

  intExpression(ast, scope) {
    let exp = new Error('Interpreter error (intExpression): ' + ast.type)

    if(ast.type === 'func_call')
      exp = interpreter.intFuncCall(ast, scope)

    else if(ast.type === 'assign')
      exp = interpreter.intAssign(ast, scope)

    else if(ast.type === 'func_def')
      exp = interpreter.intFuncDef(ast, scope)

    else if(ast.type === 'decl_if')
      exp = interpreter.intDeclIf(ast, scope)

    else if(ast.type === 'primitive')
      exp = interpreter.intPrimitive(ast, scope)

    else if(ast.type === 'variable')
      exp = interpreter.intVariable(ast, scope)

    else if(ast.type === 'func_call')
      exp = interpreter.intFuncCall(ast, scope)

    else if(ast.type === 'math_operation')
      exp = interpreter.intMathOperation(ast, scope)

    else if(ast.type === 'func_return')
      exp = interpreter.intFuncReturn(ast, scope)

    else if(ast.type === 'assign')
      exp = interpreter.intAssign(ast, scope)

    else
      throw exp

    return interpreter.extExpression(ast, exp, scope)
  },

  extExpression(ast, exp, scope) {
    if(!(isExtensible(ast) && ast.exts && ast.exts.length))
      return exp

    return ast.exts.reduce(function(acc, ext) {
      if(ext.type === 'extend_object') {
        return interpreter.intExpression(ext.args, acc)

      } else if(ext.type === 'extend_computed') {
        const index = interpreter.intExpression(ext.args, scope)
        if(!(index in acc))
          throw new ReferenceError(`Property "${index}" does not exist`)
        return acc[index]

      } else if(ext.type === 'func_call_args_chunk') {
        const args = ext.args.args.exps.map(function(exp) {
          return interpreter.intExpression(exp, scope)
        })
        return acc.apply(null, args)

      } else
        throw new Error('Interpreter error (extExpression): ' + ext.type)
    }, exp)
  },

  intMathOperation(ast, scope) {
    const ops = []
    const exps = []

    ast.args.forEach(function(arg, index) {
      if(index & 1)
        ops.push(arg)
      else
        exps.push(interpreter.intExpression(arg.parsed, scope))
    })

    return ops.reduce(function(acc, op, index) {
      const exp = exps[index + 1]

      if(op.parsed.args.operator === '+')
        return interpreter.intMathOperatorSum(acc, exp)

      else if(op.parsed.args.operator === '-')
        return interpreter.intMathOperatorSubtraction(acc, exp)

      else if(op.parsed.args.operator === '*')
        return interpreter.intMathOperatorMultiplication(acc, exp)

      else if(op.parsed.args.operator === '/')
        return interpreter.intMathOperatorDivision(acc, exp)

      else
        throw new Error('Interpreter error (intMathOperation): ' + op.parsed.args.operator)
    }, exps[0])
  },

  intMathOperatorSum(val1, val2) {
    return val1 + val2
  },

  intMathOperatorSubtraction(val1, val2) {
    return val1 - val2
  },

  intMathOperatorMultiplication(val1, val2) {
    return val1 * val2
  },

  intMathOperatorDivision(val1, val2) {
    return val1 / val2
  },

  intVariable(ast, scope) {
    if(ast.args.value in scope)
      return scope[ast.args.value]
    throw new TypeError(`"${ast.args.value}" is not defined`)
  },

  intPrimitive(ast, scope) {
    if(ast.args.type === 'number')
      return interpreter.intNumber(ast.args.args, scope)

    else if(ast.args.type === 'string')
      return interpreter.intString(ast.args.args, scope)

    else if(ast.args.type === 'boolean')
      return interpreter.intBoolean(ast.args.args, scope)

    else if(ast.args.type === 'array')
      return interpreter.intArray(ast.args.args, scope)

    else if(ast.args.type === 'object')
      return interpreter.intObject(ast.args.args, scope)

    else
      throw new Error('Interpreter error (intPrimitive): ' + ast.args.type)
  },

  intNumber(ast, scope) {
    return parseFloat(ast.value)
  },

  intString(ast, scope) {
    return ast.value
  },

  intBoolean(ast, scope) {
    return Boolean(ast.value)
  },

  intArray(ast, scope) {
    return ast.args.map(function(arg) {
      return interpreter.intExpression(arg.parsed, scope)
    })
  },

  intObject(ast, scope) {
    const obj = {}
    ast.args.forEach(function(arg) {
      if(arg.key.args.value in obj)
        throw new TypeError(`"${arg.key.args.value}" is already defined`)
      obj[arg.key.args.value] = interpreter.intExpression(arg.value, scope)
    })
    return obj
  }
}

module.exports = Object.create(interpreter)
