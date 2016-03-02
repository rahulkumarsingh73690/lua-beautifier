
function show(code) {
  console.log((new Error).stack.toString().split('\n')[2].match(/(\/[^)]+)/) && RegExp.$1);
  console.log(code.substr(0, 40));
}

// -function() {
  document.body.innerHTML =
    '<div>'
  +   '<h1>Minimalist Lua beautifier</h1>'
  + '</div>'
  + '<div class="box-js-lua-code">'
  +   '<textarea id="js_lua_code" placeholder="Paste and Ctrl + Enter to beautify"></textarea>'
  + '</div>'
  + '<div>'
  +   '<button id="js_lua_beautify">Beautify</button>'
  + '</div>'
  ;

  document.querySelector('#js_lua_beautify').addEventListener('click', function() {
    var time = -new Date;
    console.log(JSON.stringify(luaSyntaxParser(js_lua_code.value),0,2));
    console.log(time + + new Date);
  });
  var js_lua_code = document.querySelector('#js_lua_code');

  window.code = js_lua_code.value = '--Variaveis\n\
str:gsub("\\\\", "\\\\\\\\"):gsub("(%c)", controlCharsTranslation)\n\
\n\
';

  // for _, value in pairs(table) do\n\
  // end\n\
  
  /* ****************************************************************** */
  
  function luaSyntaxParser(code) {
    if(typeof(code) !== 'string') return false;
    code = luaSyntaxParser._skipUTF8BOM(code);
    return luaSyntaxParser.chunk(code);
  };
  
  /* ****************************************************************** */
  i=0;
  j=500;
  luaSyntaxParser.chunk = function(code) {
    if(i++>j) throw new Error('More than ' + j + ' loops.');
    code = luaSyntaxParser._skipSpaces(code);
    var chunks = [];
    var chunk;
    
    chunk = luaSyntaxParser._or([
      luaSyntaxParser.semiColon(code),
      luaSyntaxParser.label(code),
      luaSyntaxParser.break(code),
      luaSyntaxParser.repeat(code),
      luaSyntaxParser.do(code),
      luaSyntaxParser.goto(code),
      luaSyntaxParser.local(code),
      luaSyntaxParser.while(code),
      luaSyntaxParser.if(code),
      luaSyntaxParser.forEach(code),
      luaSyntaxParser.higherPrecedence(code),
      luaSyntaxParser.namedFunction(code),
      luaSyntaxParser.comment(code),
      luaSyntaxParser.variableAssignment(code),
      luaSyntaxParser.functionCall(code)
    ]);
    if(chunk.success) {
      code = chunk.success.code;
      delete chunk.success.code;
      chunks.push(chunk.success);
      
      code = luaSyntaxParser._skipSpaces(code);
      var next_chunk = luaSyntaxParser.chunk(code);
      if(next_chunk.success) {
        code = next_chunk.success.code;
        delete next_chunk.success.code;
        if(next_chunk.success.chunks.length > 0)
          chunks.push.apply(chunks, next_chunk.success.chunks);
      }
      
      return {
        success: {
          type: 'chunk',
          chunks: chunks,
          code: luaSyntaxParser._skipSpaces(code)
        }
      };
    }
    
    if(code.match(/^(return)\b/)) {
      chunk = {};
      code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
      var expressions_list = luaSyntaxParser.expressionsList(code);
      
      if(expressions_list.success) {
        code = expressions_list.success.code;
        delete expressions_list.success.code;
        chunk.return = expressions_list.success;
        
      }
      
      var semi_colon = luaSyntaxParser.semiColon(
        luaSyntaxParser._skipSpaces(code)
      );
      if(semi_colon.success) {
        code = semi_colon.success.code;
        delete semi_colon.success.code;
        chunk.semi_colon = semi_colon.success;
      }
      
      var comment = luaSyntaxParser.comment(code)
      if(comment.success) {
        code = luaSyntaxParser._skipSpaces(comment.success.code);
        delete comment.success.code;
        
      }
      
      return {
        success: {
          type: 'chunk',
          chunks: [chunk],
          code: luaSyntaxParser._skipSpaces(code)
        }
      };
    }
    
    return chunks;
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.comment = function(code) {
    var commit = {};
    
    if(code.match(/^\-\-\[/)) {
      commit = luaSyntaxParser.commentLong(code);
      if(commit.success) return commit;
    }
    
    if(code.match(/^\-\-/)) {
      commit = luaSyntaxParser.commentShort(code);
      if(commit.success) return commit;
    }
    
    return commit;
  };
  
  luaSyntaxParser.commentLong = function(code) {
    if(code.match(/^\-\-/) === null) return {};
    
    var string = luaSyntaxParser.stringLong(code.substr(2));
    
    if(!string.success) return string.error || string;
    if(string.success.code.match(/^\-\-/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + string.success.code[0] + '", it should be "--".']
        }
      };
    
    return {
      success: {
        type: 'comment-long',
        comment_level: string.success.string_level,
        value: '--' + string.success.value + '--',
        code: luaSyntaxParser._skipSpaces(string.success.code.substr(2))
      }
    };
  };
  
  luaSyntaxParser.commentShort = function(code) {
    if(code.match(/^\-\-/) === null) return {};
    var index = luaSyntaxParser._getNextNewLineIndex(code);
    
    return {
      success: {
        type: 'comment-short',
        value: code.substr(0, index),
        code: luaSyntaxParser._skipSpaces(code.substr(index))
      }
    };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.variableAssignment = function(code) {
    var variables_list = luaSyntaxParser.variablesList(code);
    if(!variables_list.success) return variables_list.error || variables_list;
    
    code = luaSyntaxParser._skipSpaces(variables_list.success.code);
    delete variables_list.success.code;
    
    if(code[0] !== '=')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "=".']
        }
      };
    
    var expressions_list = luaSyntaxParser.expressionsList(
      luaSyntaxParser._skipSpaces(code.substr(1))
    );
    if(!expressions_list.success) return expressions_list.error || expressions_list;
    
    code = expressions_list.success.code;
    delete expressions_list.success.code;
    
    return {
      success: {
        type: 'variable-assignment',
        variables_list: variables_list.success.variables,
        expressions_list: expressions_list.success.expressions,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  luaSyntaxParser.variablesList = function(code) {
    var variable_list = luaSyntaxParser.variable(code);
    if(!variable_list.success) return variable_list.error || variable_list;
    
    code = variable_list.success.code;
    delete variable_list.success.code;
    var variables = [variable_list.success];
    
    if(code[0] === ',') {
      var next_variable = luaSyntaxParser.variablesList(
        luaSyntaxParser._skipSpaces(code.substr(1))
      );
      
      if(next_variable.success) {
        code = next_variable.success.code;
        delete next_variable.success.code;
        if(next_variable.success.variables.length > 0)
          variables.push.apply(variables, next_variable.success.variables);
      }
    };
    
    return {
      success: {
        type: 'variables-list',
        variables: variables,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  luaSyntaxParser.variable = function(code) {
    return luaSyntaxParser._or([
      luaSyntaxParser.variableTable(code),
      luaSyntaxParser.variableName(code)
    ]);
  };
  
  luaSyntaxParser.variableTable = function(code) {
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    name.success.type = 'table';
    code = name.success.code;
    delete name.success.code;
    name.success.subs = [];
    code = luaSyntaxParser._skipSpaces(code);
    
    if(code[0] !== '[' && code[0] !== '.') return {};
    var sub;
    
    while(code[0] === '[' || code[0] === '.') {
      if(code[0] === '[') {
        code = luaSyntaxParser._skipSpaces(code.substr(1));
        
        sub = luaSyntaxParser.expression(code);
        if(!sub.success) return sub.error || sub;
        
        code = luaSyntaxParser._skipSpaces(sub.success.code);
        
        delete sub.success.code;
        name.success.subs.push(sub.success);
        
        if(code[0] !== ']')
          return {
            error: {
              type: SyntaxError,
              arguments: ['Unexpected symbol "' + code[0] + '", it should be "]".']
            }
          };
        
        code = name.success.code = luaSyntaxParser._skipSpaces(code.substr(1));
        
      } else if(code[0] === '.') {
        code = luaSyntaxParser._skipSpaces(code.substr(1));
        sub = luaSyntaxParser.variableName(code);
        if(!sub.success) return sub.error || sub;
        
        code = luaSyntaxParser._skipSpaces(sub.success.code);
        delete sub.success.code;
        name.success.subs.push(sub.success);
        
      } else break;
    }
    
    name.success.code = code;
    return name;
  };
  
  luaSyntaxParser.variableName = function(code) {
    return code.match(/^([a-z_]\w*)/i) === null || luaSyntaxParser._isReservedWord(RegExp.$1)
      ? {}
      : {
          success: {
            type: 'name',
            value: RegExp.$1,
            code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
          }
        }
    ;
  };
  
  // tableconstructor ::= ‘{’ [fieldlist] ‘}’
  // fieldlist        ::= field {fieldsep field} [fieldsep]
  // field            ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  // fieldsep         ::= ‘,’ | ‘;’
  luaSyntaxParser.tableConstructor = function(code) {
    if(code[0] !== '{') return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var fields_list = luaSyntaxParser.tableFieldsList(code);
    if(fields_list.success) {
      code = luaSyntaxParser._skipSpaces(fields_list.success.code);
      delete fields_list.success.code;
      fields_list = fields_list.success.fields_list;
      
    } else fields_list = [];
    
    if(code[0] !== '}')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "}".']
        }
      };
    
    return {
      success: {
        type: 'table-constructor',
        fields_list: fields_list,
        code: luaSyntaxParser._skipSpaces(code.substr(1))
      }
    };
  };
  
  // fieldlist ::= field {fieldsep field} [fieldsep]
  // field     ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  // fieldsep  ::= ‘,’ | ‘;’
  luaSyntaxParser.tableFieldsList = function(code) {
    var field = luaSyntaxParser.tableField(code);
    if(!field.success) return field.error || field;
    code = field.success.code;
    delete field.success.code;
    var fields_list = [field.success];
    
    var field_separator = luaSyntaxParser.tableFieldSeparator(code);
    if(field_separator.success) {
      code = field_separator.success.code;
      delete field_separator.success.code;
      fields_list.push(field_separator.success);
      
    }
    
    var next_field = luaSyntaxParser.tableFieldsList(code);
    if(next_field.success) {
      code = next_field.success.code;
      delete next_field.success.code;
      if(next_field.success.fields_list.length > 0)
        fields_list.push.apply(fields_list, next_field.success.fields_list);
      
    }
    
    return {
      success: {
        type: 'table-fields-list',
        fields_list: fields_list,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  // fieldlist ::= field {fieldsep field} [fieldsep]
  // field     ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  // fieldsep  ::= ‘,’ | ‘;’
  luaSyntaxParser.tableField = function(code) {
    // field ::= ‘[’ exp ‘]’ ‘=’ exp
    if(code[0] === '[') {
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      var expression_1 = luaSyntaxParser.expression(code);
      if(!expression_1.success) return expression_1.error || expression_1;
      
      code = expression_1.success.code;
      delete expression_1.success.code;
      
      if(code[0] !== ']')
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be "]".']
          }
        };
      
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      
      if(code[0] !== '=')
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be "=".']
          }
        };
      
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      var expression_2 = luaSyntaxParser.expression(code);
      if(!expression_2.success) return expression_2.error || expression_2;
      
      code = luaSyntaxParser._skipSpaces(expression_2.success.code);
      delete expression_2.success.code;
      
      return {
        success: {
          type: 'table-field',
          name: expression_1.success,
          value: expression_2.success,
          code: code
        }
      };
    }
    
    // field ::= Name ‘=’ exp
    var name = luaSyntaxParser.variableName(code);
    if(name.success) {
      if(name.success.code[0] === '=') {
        var expression = luaSyntaxParser.expression(luaSyntaxParser._skipSpaces(name.success.code.substr(1)));
        if(!expression.success) return expression.error || expression;
        code = luaSyntaxParser._skipSpaces(expression.success.code);
        delete expression.success.code;
        delete name.success.code;
        
        return {
          success: {
            type: 'table-field',
            name: name.success,
            value: expression.success,
            code: code
          }
        };
      }
    }
    
    // field ::= exp
    var expression = luaSyntaxParser.expression(code);
    if(!expression.success) return expression.error || expression;
    code = expression.success.code;
    delete expression.success.code;
    
    return {
      success: {
        type: 'text-field',
        name: '*',
        value: expression.success,
        code: code
      }
    };
  };
  
  // fieldlist ::= field {fieldsep field} [fieldsep]
  // field     ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  // fieldsep  ::= ‘,’ | ‘;’
  luaSyntaxParser.tableFieldSeparator = function(code) {
    return code.match(/^(,|;)/)
      ? {
          success: {
            type: 'table-field-separator',
            value: RegExp.$1,
            code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
          }
        }
      : {}
    ;
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.expressionsList = function(code) {
    var expression = luaSyntaxParser.expression(code);
    if(!expression.success) return expression.error || expression;
    
    code = luaSyntaxParser._skipSpaces(expression.success.code);
    delete expression.success.code;
    var expressions = [expression.success];
    
    if(code[0] === ',') {
      var next_expression = luaSyntaxParser.expressionsList(
        luaSyntaxParser._skipSpaces(code.substr(1))
      );
      
      if(next_expression.success) {
        code = next_expression.success.code;
        delete next_expression.success.code;
        if(expressions, next_expression.success.expressions.length > 0)
          expressions.push.apply(expressions, next_expression.success.expressions);
      }
    };
    
    return {
      success: {
        type: 'expressions-list',
        expressions: expressions,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  luaSyntaxParser.expression = function(code, flag) {
    return luaSyntaxParser._or([
      luaSyntaxParser.prefixExpression(code),
      flag === 1 || luaSyntaxParser.bExpression(code),
      flag === 1 || flag === 2 || luaSyntaxParser.uExpression(code),
      luaSyntaxParser.nil(code),
      luaSyntaxParser.true(code),
      luaSyntaxParser.false(code),
      luaSyntaxParser.number(code),
      luaSyntaxParser.string(code),
      luaSyntaxParser.threeDots(code),
      luaSyntaxParser.tableConstructor(code),
      luaSyntaxParser.anonymousFunction(code),
      luaSyntaxParser.functionCall(code),
      luaSyntaxParser.variable(code)
    ]);
  };
  
  luaSyntaxParser.prefixExpression = function(code, flag) {
    return luaSyntaxParser._or([
      flag === 1 || luaSyntaxParser.functionCall(code),
      luaSyntaxParser.higherPrecedence(code),
      luaSyntaxParser.variable(code),
    ]);
  };
  
  luaSyntaxParser.nil = function(code) {
    return code.match(/^nil\b/) === null
      ? {}
      : {
          success: {
            type: 'nil',
            code: luaSyntaxParser._skipSpaces(code.substr(3))
          }
        }
    ;
  };
  
  luaSyntaxParser.true = function(code) {
    return code.match(/^true\b/) === null
      ? {}
      : {
          success: {
            type: 'true',
            code: code.substr(4)
          }
        }
    ;
  };
  
  luaSyntaxParser.false = function(code) {
    return code.match(/^false\b/) === null
      ? {}
      : {
          success: {
            type: 'false',
            code: code.substr(5)
          }
        }
    ;
  };
  
  luaSyntaxParser.number = function(code) {
    var number = code.match(/^\-?(?:0x[a-f0-9]+|[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?)/i);
    return number
      ? {
          success: {
            type: 'number',
            value: number[0],
            code: code.substr(number[0].length)
          }
        }
      : {}
    ;
  };
  
  luaSyntaxParser.anonymousFunction = function(code) {
    if(code.match(/^(function)\b/) === null) return {};
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    
    var definition = luaSyntaxParser.functionBody(code);
    if(!definition.success) return definition.error || definition;
    code = luaSyntaxParser._skipSpaces(definition.success.code);
    delete definition.success.code;
    
    return {
      success: {
        type: 'anonymous-function',
        arguments_list: definition.success.arguments_list,
        function_definition: definition.success.body,
        function_return: definition.success.return,
        code: code
      }
    };
  };
  
  luaSyntaxParser.threeDots = function(code) {
    return code.match(/^\.{3}/)
      ? {
          success: {
            type: 'argument-three-dots',
            code: code.substr(3)
          }
        }
      : {}
    ;
  };
  
  luaSyntaxParser.bExpression = function(code) {
    var expression_1 = luaSyntaxParser.expression(code, 1);
    if(!expression_1.success) return expression_1.error || expression_1;
    
    code = luaSyntaxParser._skipSpaces(expression_1.success.code);
    delete expression_1.success.code;
    
    var binary_operator = luaSyntaxParser.binaryOperator(code);
    if(!binary_operator.success) return binary_operator.error || binary_operator;
    
    code = binary_operator.success.code;
    delete binary_operator.success.code;
    
    var expression_2 = luaSyntaxParser.expression(code);
    if(!expression_2.success) return expression_2.error || expression_2;
    
    code = expression_2.success.code;
    delete expression_2.success.code;
    
    return {
      success: {
        type: 'expression-binary_operator-expression',
        expressions: [
          expression_1.success,
          binary_operator.success,
          expression_2.success
        ],
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  // exp ::=  nil | false | true | Numeral | LiteralString | ‘...’ |
  //          functiondef | prefixexp | tableconstructor |
  //          exp binop exp | unop exp 
  // unop ::= ‘-’ | not | ‘#’ | ‘~’
  luaSyntaxParser.uExpression = function(code) {
    if(code.match(/^(\-(?!\-)|not|#|~(?!=))/) === null) return {};
    
    var unary_operator = RegExp.$1;
    code = luaSyntaxParser._skipSpaces(code.substr(unary_operator.length));
    var expression = luaSyntaxParser.expression(code, 3);
    if(!expression.success) return expression.error || expression;
    code = luaSyntaxParser._skipSpaces(expression.success.code);
    delete expression.success.code;
    
    return {
      success: {
        type: 'unary-expression',
        unary_operator: unary_operator,
        expression: expression.success,
        code: code
      }
    };
  };
  
  /* ****************************************************************** */
  
  // function funcname funcbody
  // funcname ::= Name {‘.’ Name} [‘:’ Name]
  // funcbody ::= ‘(’ [parlist] ‘)’ block end
  luaSyntaxParser.namedFunction = function(code) {
    if(code.match(/^(function)\b/) === null) return {};
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    
    var function_name = luaSyntaxParser.functionName(code);
    if(!function_name.success) return function_name.error || function_name;
    
    code = luaSyntaxParser._skipSpaces(function_name.success.code);
    delete function_name.success.code;
    
    var definition = luaSyntaxParser.functionBody(code)
      , function_definition = {}
      , function_return = {}
    ;
    
    if(!definition.success) return definition.error || definition;
    
    code = definition.success.code;
    delete definition.success.code;
    function_definition = definition.success.body;
    function_return = definition.success.return;
    
    return {
      success: {
        type: 'named-function',
        name: function_name,
        arguments_list: definition.success.arguments_list,
        function_definition: function_definition,
        function_return: function_return,
        code: code
      }
    };
  };
  
  // funcname ::= Name {‘.’ Name} [‘:’ Name]
  luaSyntaxParser.functionName = function(code) {
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    var sub_names = []
      , sub_property = ''
    ;
    
    code = luaSyntaxParser._skipSpaces(name.success.code);
    delete name.success.code;
    
    var sub_name;
    while(code[0] === '.') {
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      sub_name = luaSyntaxParser.variableName(code);
      if(!sub_name.success) break;
      code = luaSyntaxParser._skipSpaces(sub_name.success.code);
      sub_names.push(sub_name.success.value);
      delete sub_name.success.code;
      
    }
    
    if(code[0] === ':') {
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      sub_property = luaSyntaxParser.variableName(code);
      if(sub_property.success) {
        code = sub_property.success.code;
        delete sub_property.success.code;
        sub_property = sub_property.success.value;
        
      }
    }
    
    return {
      success: {
        type: 'function-name',
        name: name.success.value,
        sub_names: sub_names,
        sub_property: sub_property,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  /* ****************************************************************** */
  
  // parlist ::= namelist [‘,’ ‘...’] | ‘...’
  luaSyntaxParser.namesList = function(code) {
    var three_dots = luaSyntaxParser.threeDots(code);
    if(three_dots.success)
      return {
        success: {
          type: three_dots.success.type,
          argument_names: [{value: '...'}],
          code: three_dots.success.code
        }
      };
    
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    code = name.success.code;
    delete name.success.code;
    var argument_names = [name.success];
    
    if(code[0] === ',') {
      var next_name = luaSyntaxParser.namesList(luaSyntaxParser._skipSpaces(code.substr(1)));
      if(next_name.success) {
        code = next_name.success.code;
        delete next_name.success.code;
        if(next_name.success.argument_names.length > 0)
          argument_names = argument_names.concat(next_name.success.argument_names).map(function(name) {
            return name.value && name.value || name;
          });
      }
    }
    
    return {
      success: {
        type: 'argument-list',
        argument_names: argument_names,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  // args ::=  ‘(’ [explist] ‘)’ | tableconstructor | LiteralString
  luaSyntaxParser.argumentsList = function(code) {
    if(code[0] === '(') {
      var expressions_list = luaSyntaxParser.expressionsList(luaSyntaxParser._skipSpaces(code.substr(1)));
      
      if(!expressions_list.success) {
        code = luaSyntaxParser._skipSpaces(expressions_list.success.code);
        if(code[0] !== ')')
          return {
            error: {
              type: SyntaxError,
              arguments: ['Unexpected symbol "' + code[0] + '", it should be ")".']
            }
          };

        return {
          success: {
            type: 'argument-empty',
            code: luaSyntaxParser._skipSpaces(code.substr(1))
          }
        };
      }
      
      expressions_list.success.code = luaSyntaxParser._skipSpaces(expressions_list.success.code);
      if(expressions_list.success.code[0] !== ')')
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be ")".']
          }
        };

      expressions_list.success.code = luaSyntaxParser._skipSpaces(expressions_list.success.code.substr(1));
      return expressions_list;
    }
    
    var string = luaSyntaxParser.string(code);
    if(string.success) {
      string.success.code = luaSyntaxParser._skipSpaces(string.success.code);
      string.success.type = 'argument-string';
      string.success.argument_names = [string.success.value];
      delete string.success.value;
      
      return string;
    }
    
    var table = luaSyntaxParser.tableConstructor(code);
    if(table.success) {
      table.success.type = 'argument-table';
      table.success.code = luaSyntaxParser._skipSpaces(table.success.code);
      
      return table;
    }
    
    return {};
  };
  
  luaSyntaxParser.functionBody = function(code) {
    if(code[0] !== '(')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "(".']
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    
    var arguments_list = luaSyntaxParser.namesList(code);
    if(arguments_list.success) {
      code = arguments_list.success.code;
      delete arguments_list.success.code;
      arguments_list = arguments_list.success.argument_names;
      
    } else arguments_list = [];
    
    if(code[0] !== ')')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be ")".']
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var chunk = luaSyntaxParser.chunk(code)
      , chunks = {}
    ;
    
    if(chunk.success) {
      code = chunk.success.code;
      delete chunk.success.code;
      chunks = chunk.success.chunks;
      
    }
    
    var function_body = {
      type: 'function_body',
      body: chunks,
      arguments_list: arguments_list
    }
    
    if(code.match(/^(end)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
        }
      }
    
    function_body.code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    return {success: function_body};
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.string = function(code) {
    var string = {};
    
    if(code.match(/^\[/)) {
      string = luaSyntaxParser.stringLong(code);
      if(string.success) return string;
    }
    
    if(code.match(/^['"]/)) {
      string = luaSyntaxParser.stringShort(code);
      if(string.success) return string;
    }
    
    return string;
  };
  
  luaSyntaxParser.stringShort = function(code) {
    if(code.match(/^['"]/) === null) return {};
    var delimiter = code[0]
      , regex = RegExp('^[^' + delimiter + '\\r\\n]+')
      , tmp
    ;
    string = code.substr(0, 1);
    code = code.substr(1);
    
    while(tmp = code.match(regex) && RegExp['$&']) {
      if(code[tmp.length] === '\r' || code[tmp.length] === '\n')
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected new line "' + code.substr(0, tmp.length + 1) + '".']
          }
        };
      
      string += tmp;
      code = code.substr(tmp.length);
      
      // Se o último caractere não for \ 
      //   Ex.: "texto", o último caractere é "o"
      // Ou haja um número par de \ 
      //   Ex.: "o caractere \\ (barra)"
      // Este será o fim do texto.
      //
      if(tmp[tmp.length - 1] !== '\\' || (tmp.match(/(\\+)$/) && !(RegExp.$1.length & 1)))
        break;
      
      string += delimiter;
      code = code.substr(1);
    }
    string += code.substr(0, 1);
    
    return {
      success: {
        type: 'string-short',
        value: string,
        code: luaSyntaxParser._skipSpaces(code.substr(1))
      }
    };
  };
  
  luaSyntaxParser.stringLong = function(code) {
    if(code.match(/^(\[(=*)\[)/) === null) return {};
    
    var string_level = RegExp.$2
      , string_begin = RegExp.$1
      , string_end = ']' + string_level + ']'
      , string_end_index = code.indexOf(string_end)
    ;
    
    if(string_end_index === -1)
      return {
        error: {
          type: SyntaxError,
          arguments: ['End of string "' + string_begin + '" not found, it should be "' + string_end + '".']
        }
      };
    
    string = code.substr(0, string_end_index + string_end.length);
    
    return {
      success: {
        type: 'string-long',
        string_level: string_level,
        value: string,
        code: code.substr(string.length)
      }
    };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.binaryOperator = function(code) {
    var operator = code.match(/^(?:>>|>=|>|<<|<=|<|\/\/|\/|~=|~|==|\*|\-(?!\-)|\+|\^|%|&|\||\.\.|and|or)/);
    if(operator === null) return {};
    return {
      success: {
        type: 'operator',
        value: operator[0],
        code: luaSyntaxParser._skipSpaces(code.substr(operator[0].length))
      }
    };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.semiColon = function(code) {
    return code.match(/^;/)
      ? {
          success: {
            type: 'semi-colon',
            code: luaSyntaxParser._skipSpaces(code.substr(1))
          }
        }
      : {}
    ;
  };
  
  /* ****************************************************************** */
  
  // for Name ‘=’ exp ‘,’ exp [‘,’ exp] do block end
  // for namelist in explist do block end
  luaSyntaxParser.forEach = function(code) {
    if(code.match(/^(for)\b/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var name = luaSyntaxParser.variableName(code);
    if(name.success && luaSyntaxParser._skipSpaces(name.success.code)[0] === '=') {
      code = luaSyntaxParser._skipSpaces(name.success.code);
      delete name.success.code;
      
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      var value = luaSyntaxParser.expression(code);
      if(!value.success) return value.error || value;
      code = luaSyntaxParser._skipSpaces(value.success.code);
      delete value.success.code;
      
      if(code[0] !== ',')
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be ",".']
          }
        };
      
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      var expression_1 = luaSyntaxParser.expression(code);
      if(!expression_1.success) return expression_1.error || expression_1;
      code = luaSyntaxParser._skipSpaces(expression_1.success.code);
      delete expression_1.success.code;
      
      var expression_3;
      if(code[0] === ',') {
        code = luaSyntaxParser._skipSpaces(code.substr(1));
        var expression_2 = luaSyntaxParser.expression(code);
        if(!expression_2.success) return expression_2.error || expression_2;
        code = luaSyntaxParser._skipSpaces(expression_2.success.code);
        delete expression_2.success.code;
        
      }
      
      if(code.match(/^(do)\b/) === null)
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be "do".']
          }
        };
      
      code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
      var block = luaSyntaxParser.chunk(code);
      if(!block.success) return block.error || block;
      code = luaSyntaxParser._skipSpaces(block.success.code);
      delete block.success.code;
      
      if(code.match(/^(end)\b/) === null)
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
          }
        };
      
      return {
        success: {
          type: 'for',
          name: name.success,
          value: value.success,
          expression_1: expression_1.success,
          expression_2: expression_2 && expression_2.success,
          block: block.success,
          code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
        }
      };
      
    }
    
    var names_list = luaSyntaxParser.namesList(code);
    if(!names_list.success) return names_list.error || names_list;
    
    code = luaSyntaxParser._skipSpaces(names_list.success.code);
    delete names_list.success.code;
    
    if(code.match(/^(in)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "in".']
        }
      };

    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var expressions_list = luaSyntaxParser.expressionsList(code);
    if(!expressions_list.success) return expressions_list.error || expressions_list;
    
    code = luaSyntaxParser._skipSpaces(expressions_list.success.code);
    delete expressions_list.success.code;
    if(code.match(/^(do)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "do".']
        }
      };

    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var block = luaSyntaxParser.chunk(code);
    if(!block.success) return block.error || block;
    
    code = luaSyntaxParser._skipSpaces(block.success.code);
    delete block.success.code;
    if(code.match(/^(end)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
        }
      };
    
    return {
      success: {
        type: 'for-expression',
        names_list: names_list.success,
        expressions_list: expressions_list.success,
        block: block.success,
        code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
      }
    };
  };
  
  /* ****************************************************************** */
  
  // functioncall ::= prefixexp args | prefixexp ‘:’ Name args 
  // prefixexp    ::= var | functioncall | ‘(’ exp ‘)’
  // var          ::= Name | prefixexp ‘[’ exp ‘]’ | prefixexp ‘.’ Name 
  // args         ::= ‘(’ [explist] ‘)’ | tableconstructor | LiteralString 
  luaSyntaxParser.functionCall = function(code) {
    var function_name = luaSyntaxParser.prefixExpression(code, 1);
    if(!function_name.success) return function_name.error || function_name;
    
    code = function_name.success.code;
    delete function_name.success.code;
    var property;
    
    if(code[0] === ':') {
      property = luaSyntaxParser.variableName(
        luaSyntaxParser._skipSpaces(code.substr(1))
      );
      
      if(property.success) {
        code = property.success.code;
        delete property.success.code;
        
      }
    }
    
    var arguments_list = luaSyntaxParser.argumentsList(code);
    if(!arguments_list.success) return arguments_list.error || arguments_list;

    code = luaSyntaxParser._skipSpaces(arguments_list.success.code);
    delete arguments_list.success.code;
    
    return {
      success: {
        type: 'function-call',
        name: function_name.success,
        property: property && property.success,
        arguments_list: arguments_list.success,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  /* ****************************************************************** */
  
  // if exp then block {elseif exp then block} [else block] end
  // exp ::=  nil | false | true | Numeral | LiteralString | ‘...’
  //          functiondef | prefixexp | tableconstructor
  //          | exp binop exp | unop exp
  luaSyntaxParser.if = function(code) {
    if(code.match(/^(if)\b/) === null) return {};
    
    var _if = {
      type: 'if',
      elseifs: [],
      otherwise: {}
    };
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var expression_1 = luaSyntaxParser.expression(code);
    if(!expression_1.success) return expression_1 || expression_1.success;
    
    code = luaSyntaxParser._skipSpaces(expression_1.success.code);
    delete expression_1.success.code;
    _if.condition = expression_1.success;
    
    if(code.match(/^(then)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "then".']
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var block = luaSyntaxParser.chunk(code);
    if(!block.success) return block.error || block;
    
    code = luaSyntaxParser._skipSpaces(block.success.code);
    delete block.success.code;
    _if.block = block.success;
    
    var elseif_condition
      , elseif_block
      , else_block
    ;
    
    while(code.match(/^(elseif)\b/)) {
      code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
      
      elseif_condition = luaSyntaxParser.expression(code);
      if(!elseif_condition.success) return elseif_condition || elseif_condition.success;
      
      code = luaSyntaxParser._skipSpaces(elseif_condition.success.code);
      delete elseif_condition.success.code;
      
      if(code.match(/^(then)\b/) === null)
        return {
          error: {
            type: SyntaxError,
            arguments: ['Unexpected symbol "' + code[0] + '", it should be "then".']
          }
        };
      
      code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
      
      elseif_block = luaSyntaxParser.chunk(code);
      if(!elseif_block.success) return elseif_block.error || elseif_block;
      
      code = luaSyntaxParser._skipSpaces(elseif_block.success.code);
      delete elseif_block.success.code;
      
      _if.elseifs.push({
        condition: elseif_condition.success,
        block: elseif_block.success
      });
    }
    
    if(code.match(/^(else)\b/)) {
      else_block = luaSyntaxParser.chunk(luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length)));
      if(else_block.success) {
        code = luaSyntaxParser._skipSpaces(else_block.success.code);
        delete else_block.success.code;
        _if.otherwise = else_block.success;
      }
    }
    
    // if exp then block {elseif exp then block} [else block] end
    if(code.match(/^(end)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
        }
      };
    
    _if.code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    return {success: _if};
  };
  
  /* ****************************************************************** */
  
  // local function Name funcbody
  // local namelist [‘=’ explist]
  luaSyntaxParser.local = function(code) {
    if(code.match(/^(local)\b/) === null) return {};
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    
    if(code.match(/^(function)\b/))
      return luaSyntaxParser.localNamedFunction(
        luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
      );
    
    var names_list = luaSyntaxParser.namesList(code);
    if(!names_list.success) return names_list.error || names_list;
    code = luaSyntaxParser._skipSpaces(names_list.success.code);
    delete names_list.success.code;
    
    if(code[0] !== '=')
      return {
        success: {
          type: 'local-variable-assignment',
          names_list: names_list.success.argument_names,
          code: code
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var expressions_list = luaSyntaxParser.expressionsList(code);
    if(!expressions_list.success) return expressions_list.error || expressions_list;
    code = luaSyntaxParser._skipSpaces(expressions_list.success.code);
    delete expressions_list.success.code;
    
    return {
      success: {
        type: 'local-variable-assignment',
        names_list: names_list.success.argument_names,
        expressions_list: expressions_list.success,
        code: code
      }
    };
  };
  
  luaSyntaxParser.localNamedFunction = function(code) {
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    code = luaSyntaxParser._skipSpaces(name.success.code);
    delete name.success.code;
    
    var definition = luaSyntaxParser.functionBody(code);
    if(!definition.success) return definition.error || definition;
    
    return {
      success: {
        type: 'local-named-function',
        name: name.success.value,
        arguments_list: definition.success.arguments_list,
        function_definition: definition.success.body,
        function_return: definition.success.return,
        code: definition.success.code
      }
    };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.higherPrecedence = function(code) {
    if(code[0] !== '(') return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var expression = luaSyntaxParser.expression(code);
    if(!expression.success) return expression.error || expression;
    
    code = luaSyntaxParser._skipSpaces(expression.success.code);
    if(code[0] !== ')')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be ")".']
        }
      };
    
    expression.success.code = luaSyntaxParser._skipSpaces(code.substr(1));
    expression.success.type = 'higher-precedence-expression';
    return expression;
  };
  
  /* ****************************************************************** */
  
  // while exp do block end
  luaSyntaxParser.while = function(code) {
    if(code.match(/^(while)\b/) === null) return {};
    
    var expression = luaSyntaxParser.expression(luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length)));
    if(!expression.success) return expression.error || expression;
    
    code = luaSyntaxParser._skipSpaces(expression.success.code);
    delete expression.success.code;
    
    if(code.match(/^(do)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "do".']
        }
      };
    
    var block = luaSyntaxParser.chunk(code.substr(RegExp.$1.length));
    if(!block.success) return block.error || block;
    
    code = luaSyntaxParser._skipSpaces(block.success.code);
    delete block.success.code;
    
    if(code.match(/^(end)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
        }
      };
    
    return {
      success: {
        type: 'while',
        expression: expression.success,
        block: block.success,
        code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
      }
    };
  };
  
  /* ****************************************************************** */
  
  // label
  luaSyntaxParser.label = function(code) {
    if(code.match(/^(::)/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    code = luaSyntaxParser._skipSpaces(name.success.code);
    delete name.success.code;
    
    if(code.match(/^(::)/) == null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "::".']
        }
      };
    
    return {
      success: {
        type: 'label',
        name: name.success.value,
        code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
      }
    };
  };
  
  /* ****************************************************************** */
  
  // break
  luaSyntaxParser.break = function(code) {
    return code.match(/^(break)\b/) === null
      ? {}
      : {
          success: {
            type: 'break',
            code: luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length))
          }
        }
    ;
  };
  
  /* ****************************************************************** */
  
  // goto Name
  luaSyntaxParser.goto = function(code) {
    if(code.match(/^(goto)\b/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    code = luaSyntaxParser._skipSpaces(name.success.code);
    delete name.success.code;
    
    return {
      success: {
        type: 'goto',
        name: name.success.value,
        code: code
      }
    };
  };
  
  /* ****************************************************************** */
  
  // do block end
  luaSyntaxParser.do = function(code) {
    if(code.match(/^(do)\b/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var block = luaSyntaxParser.chunk(code);
    if(!block.success) return block.error || block;
    
    code = luaSyntaxParser._skipSpaces(block.success.code);
    delete block.success.code;
    
    if(code.match(/^(end)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "end".']
        }
      }
    
    return{
      success: {
        type: 'do',
        block: block.success,
        code: code
      }
    };
  };
  
  /* ****************************************************************** */
  
  // repeat block until exp
  luaSyntaxParser.repeat = function(code) {
    if(code.match(/^(repeat)\b/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length));
    var block = luaSyntaxParser.chunk(code);
    if(!block.success) return block.error || block;
    code = luaSyntaxParser._skipSpaces(block.success.code);
    delete block.success.code;
    
    if(code.match(/^(until)\b/) === null)
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "until".']
        }
      }
    
    var expression = luaSyntaxParser.expression(luaSyntaxParser._skipSpaces(code.substr(RegExp.$1.length)));
    if(!expression.success) return expression.error || expression;
    
    code = luaSyntaxParser._skipSpaces(expression.success.code);
    delete expression.success.code;
    
    return {
      success: {
        type: 'repeat',
        block: block.success,
        expression: expression.success,
        code: code
      }
    };
  };
  
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  /* ****************************************************************** */
  
  luaSyntaxParser._getNextNewLineIndex = function(code) {
    var index = code.indexOf('\r\n'); // Windows new line
    if(!~index) index = code.indexOf('\n'); // Linux new line
    if(!~index) index = code.indexOf('\r'); // Mac new line
    
    // <index> may be the index of the next new line.
    // If there is no new line return the length of the code as the index of the next line.
    //
    return ~index ? index : code.length;
  };
  
  luaSyntaxParser._skipSpaces = function(line) {
    return line.replace(/^[\t\s\n\r]*/, '');
  };
  
  luaSyntaxParser._skipUTF8BOM = function(line) {
    return line.replace(/^\ufeff/, '');
  };
  
  luaSyntaxParser._or = function(arguments) {
    return arguments.reduce(function(result, processing) {
      return (result && result.success && result) ||
             (processing && processing.success && processing) ||
             result;
    }, {});
  };
  
  luaSyntaxParser._reserved_words = 'and break do else elseif end false for function goto if in then local nil true not until or while repeat return'.split(' ');
  luaSyntaxParser._isReservedWord = function(word) {
    return !!~luaSyntaxParser._reserved_words.indexOf(word);
  };
  
  /* ****************************************************************** */

  setTimeout(window.x = function(f) {
    var time = -new Date;
    // s = JSON.stringify(chunks = luaSyntaxParser(js_lua_code.value), 0, 2);
    // document.write("<pre>" + (time + +new Date) + "ms\n\n" + s);
  }, 1000);
// }()
