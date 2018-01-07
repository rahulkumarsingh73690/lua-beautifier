
const https = require('https')
const http = require('http')
const fs = require('fs')
const util = require('util')
const path = require('path')
const url = require('url')
const querystring = require('querystring')

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
      return subject[iter_name](function(item, index, index2) {
        return iter_name === 'reduce' ? callback(item, index, index2) : callback(item, index)
      }, init)

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
        const parsed_url = url.parse(request.url)
        const req = {
          url: request.url,
          method: request.method,
          headers: request.headers,
          pathname: parsed_url.pathname,
          query: querystring.parse(parsed_url.query)
        }
        let data = ''
        request.setEncoding('utf-8')
        request.on('data', function(buffer) { data += buffer })
        request.on('end', function() {
          req.payload = data
          req.json = {}
          req.is_json = false

          try {
            req.json = JSON.parse(data)
            req.is_json = true
          } catch(error) {}

          options.request.reply(req, function(data, headers, status_code) {
            if(!util.isObject(headers))
              headers = {}
            if(!util.isNumber(status_code))
              status_code = 200
            response.writeHead(status_code, headers)
            response.end(data)
          })
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
  print: function() {
    console.log.apply(console, Array.from(arguments))
    return true
  },
  type: function(value) {
    return Array.isArray(value) ? 'array' : typeof value
  },
  contains: function(subject, find) {
    return !!~subject.indexOf(find)
  },

  // date
  date: function() {
    return new Date
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

  // math
  rand: function() { return Math.random() },

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
  map: function(array, callback) {
    return iter('map', array, callback)
  },
  reduce: function(array, callback, init) {
    return iter('reduce', array, callback, init)
  },
  filter: function(array, callback) {
    return iter('filter', array, callback)
  },

  // array
  length: function(subject) {
    return typeof(subject) === 'string' || Array.isArray(subject) ? subject.length : 0
  },
  arr_push: function(array, item) {
    return array.push(item)
  },
  arr_pop: function(array) {
    return array.pop()
  },
  arr_replace: function(array, start_range, end_range, new_value) {
    array.splice(start_range, end_range, new_value)
    return array
  },
  arr_remove: function(array, start_range, end_range) {
    array.splice(start_range, end_range)
    return array
  },
  arr_sort: function(array) {
    return array.sort()
  },

  // object
  obj_keys: function(object) {
    return object && typeof(object) === 'object' ? Object.keys(object) : []
  },

  // string
  str_rand: function() { return Math.random().toString(36).substr(2) },
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
  str_upper: function(string) {
    return string.toUpperCase()
  },
  str_lower: function(string) {
    return string.toLowerCase()
  }
}

const interpreter = {
  parse(ast, scope, options) {
    options = {
      old_scope: options && options.old_scope,
      via: options && options.via,
      filename: options && options.filename
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
    const unary = []

    ast.args.value.parsed.args.forEach(function(arg, index) {
      if(arg.type === 'log_op')
        ops.push(arg)
      else if(arg.type === 'log_unary')
        unary.push(arg)
      else {
        arg.unary = unary.shift()
        exps.push(arg)
      }
    })

    return ops.reduce(function(val1, op, index) {
      const val2 = exps.shift()

      if(op.args.value === '<')
        return interpreter.intLogOpLT(val1, val2, scope)

      else if(op.args.value === '>')
        return interpreter.intLogOpGT(val1, val2, scope)

      else if(op.args.value === '==')
        return interpreter.intLogOpEQ(val1, val2, scope)

      else if(op.args.value === '!=')
        return interpreter.intLogOpNEQ(val1, val2, scope)

      else if(op.args.value === '>=')
        return interpreter.intLogOpGTE(val1, val2, scope)

      else if(op.args.value === '<=')
        return interpreter.intLogOpLTE(val1, val2, scope)

      else if(op.args.value === 'and')
        return interpreter.intLogOpAND(val1, val2, scope)

      else if(op.args.value === 'or')
        return interpreter.intLogOpOR(val1, val2, scope)

      else if(op.args.value === 'xor')
        return interpreter.intLogOpXOR(val1, val2, scope)

      else
        throw new Error('Interpreter error (intCondBlock): ' + op.args.value)
    }, interpreter.intExpression(exps.shift(), scope))
  },

  // not
  intLogOpNOT(val1) {
    return !val1
  },

  // and
  intLogOpAND(val1, exp, scope) {
    return val1 && interpreter.intExpression(exp, scope);
  },

  // or
  intLogOpOR(val1, exp, scope) {
    return val1 || interpreter.intExpression(exp, scope);
  },

  // xor
  intLogOpXOR(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope);
    return (val1 && !val2) || (!val1 && val2);
  },

  // <=
  intLogOpLTE(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 !== false && val1 <= val2 ? val2 : false;
  },

  // >=
  intLogOpGTE(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 !== false && val1 >= val2 ? val2 : false;
  },

  // <
  intLogOpLT(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 !== false && val1 < val2 ? val2 : false;
  },

  // >
  intLogOpGT(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 !== false && val1 > val2 ? val2 : false
  },

  // ==
  intLogOpEQ(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 === val2
  },

  // !=
  intLogOpNEQ(val1, exp, scope) {
    const val2 = interpreter.intExpression(exp, scope)
    return val1 !== val2
  },

  intUnary(ast, exp) {
    if(ast.unary.type === 'log_unary')
      return interpreter.intLogOpNOT(exp)
    throw new Error('Interpreter error (intUnary): ' + ast.unary.type)
  },

  intFuncDef(ast, scope) {
    return scope[ast.args.name.args.value] = function() {
      const values = Array.from(arguments)
      const inner_scope = inheritGlobalScope(scope,{old_scope:false})

      if(ast.args.args.args.args.args.length !== values.length)
        throw new TypeError(`"${ast.args.name.args.value}": "${ast.args.args.args.args.args.length}" arguments are expected but "${values.length}" were provided.`)

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
    if(!(ast.args.name.args.value in scope || ast.args.name.args.value in global_scope))
      throw new ReferenceError(`"${ast.args.name.args.value}" is not defined`)

    const func = scope[ast.args.name.args.value] || global_scope[ast.args.name.args.value]
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

    exp = interpreter.extExpression(ast, exp, scope)

    if(ast.unary)
      exp = interpreter.intUnary(ast, exp)

    return exp
  },

  extExpression(ast, exp, scope) {
    if(!(isExtensible(ast) && ast.exts && ast.exts.length))
      return exp

    return ast.exts.reduce(function(acc, ext) {
      if(ext.type === 'extend_object') {
        return interpreter.intExpression(ext.args, {...scope, ...acc})

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
    return ast.value === 'T'
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
