
function ensureObject(obj) {
  return obj && typeof(obj) === 'object' ? obj : {}
}

function inheritGlobalScope(obj) {
  return Object.assign(Object.create(global_scope), ensureObject(obj))
}

const global_scope = {
  print: console.log.bind(console)
}

const interpreter = {
  parse(ast, scope) {
    scope = inheritGlobalScope(scope)

    return ast.parsed.args.value.reduce(function(acc, chunk) {
      if(chunk.parsed.type === 'func_call')
        interpreter.intFuncCall(chunk.parsed, scope)

      else if(chunk.parsed.type === 'assign')
        interpreter.intAssign(chunk.parsed, scope)

      else if(chunk.parsed.type === 'func_def')
        interpreter.intFuncDef(chunk.parsed, scope)

      else if(chunk.parsed.type === 'func_return')
        return interpreter.intFuncReturn(chunk.parsed, scope)

      else
        throw new Error('Interpreter error (parse): ' + chunk.parsed.type)
    }, void 0)
  },

  intFuncDef(ast, scope) {
    scope[ast.args.name.args.value] = function() {
      const values = Array.from(arguments)
      const inner_scope = inheritGlobalScope(scope)

      if(ast.args.args.args.args.args.length !== values.length)
        throw new TypeError(`"${ast.args.args.args.args.args.length}" arguments are expected but "${values.length}" were provided.`)

      values.forEach(function(value, index) {
        const var_name = ast.args.args.args.args.args[index].args.value
        inner_scope[var_name] = value
      })

      return interpreter.parse({parsed: ast.args.body}, inner_scope)
    }
  },

  intFuncReturn(ast, scope) {
    return interpreter.intExpression(ast.args, scope)
  },

  intAssign(ast, scope) {
    scope[ast.args.left.args.value] = interpreter.intExpression(ast.args.right)
  },

  intFuncCall(ast, scope) {
    if(!(ast.args.name.args.value in scope))
      throw new ReferenceError(`"${ast.args.name.args.value}" is not a function`)

    const func = scope[ast.args.name.args.value]
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
    if(ast.type === 'primitive')
      return interpreter.intPrimitive(ast, scope)

    else if(ast.type === 'variable')
      return interpreter.intVariable(ast, scope)

    else if(ast.type === 'func_call')
      return interpreter.intFuncCall(ast, scope)

    else if(ast.type === 'math_operation')
      return interpreter.intMathOperation(ast, scope)

    else
      throw new Error('Interpreter error (intExpression): ' + ast.type)
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
    throw new TypeError(`${ast.args.value} is not defined`)
  },

  intPrimitive(ast, scope) {
    if(ast.args.type === 'number')
      return interpreter.intNumber(ast.args.args, scope)

    else if(ast.args.type === 'string')
      return interpreter.intString(ast.args.args, scope)

    else if(ast.args.type === 'boolean')
      return interpreter.intBoolean(ast.args.args, scope)

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
  }
}

module.exports = Object.create(interpreter)
