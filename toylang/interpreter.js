
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

    ast.parsed.args.value.forEach(function(chunk) {
      if(chunk.parsed.type === 'func_call')
        interpreter.intFuncCall(chunk.parsed, scope)

      if(chunk.parsed.type === 'assign')
        interpreter.intAssign(chunk.parsed, scope)
    })
  },

  intAssign(ast, scope) {
    scope[ast.args.left.args.value] = interpreter.intExpression(ast.args.right)
  },

  intFuncCall(ast, scope) {
    if(!(ast.args.name.args.value in scope))
      throw new ReferenceError(`"${chunk.parsed.args.name.args.value}" is not a function`)

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
      return interpreter.intPrimitive(ast.args, scope)

    if(ast.type === 'variable')
      return interpreter.intVariable(ast.args, scope)
  },

  intVariable(ast, scope) {
    if(ast.value in scope)
      return scope[ast.value]
    throw new TypeError(`${ast.value} is not defined`)
  },

  intPrimitive(ast, scope) {
    if(ast.type === 'number')
      return interpreter.intNumber(ast.args, scope)

    if(ast.type === 'string')
      return interpreter.intString(ast.args, scope)

    if(ast.type === 'boolean')
      return interpreter.intBoolean(ast.args, scope)
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
