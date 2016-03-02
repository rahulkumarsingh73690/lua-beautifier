
function show(code) {
  return code.substr(0, 30);
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
// if(!localStorage.x)
  // localStorage.x = 'POS.a.s.d.f POS.a.s.d,f POS.a.s,d.f POS.a.s,d,f POS.a,s.d.f POS.a,s.d,f POS.a,s,d.f POS.a,s,d,f POS,a.s.d.f POS,a.s.d,f POS,a.s,d.f POS,a.s,d,f POS,a,s.d.f POS,a,s.d,f POS,a,s,d.f POS,a,s,d,f';
// a=localStorage.x.split(' ')[0]
// localStorage.x = ~localStorage.x.indexOf(a + ' ') ? localStorage.x.replace(a + ' ', '') : ''
// console.log(a);

  var js_lua_code = document.querySelector('#js_lua_code');
// ' + a + '= {1,  2,  3,  4,\n\

  window.code = js_lua_code.value = '--Variaveis\n\
--[==[\n\
asd\n\
00zzzz\n\
dd0d---\n\
asd]==]--\n\
POS[function (a,b) return a+b end]= {1,  2,  3,  4,\n\
       5,  6,  7,  8,\n\
	   9,  10, 11, 12,\n\
	   13, 14, 15, 16,\n\
}\n\
p = {x= 0}\n\
StrEnigma = {}\n\
--Funções\n\
function criarCodigo(enigma)\n\
for letras = 1, string.len(enigma) do\n\
varCodigo = (string.sub(enigma,letras, letras))\n\
table.insert(StrEnigma, varCodigo)\n\
end\n\
end\n\
\n\
function decifrarEnigma(enigma)\n\
criarCodigo(string.lower(enigma))\n\
if StrEnigma[1] == "z" then\n\
p.x = POS[13]\n\
elseif StrEnigma[1] == "a" then\n\
p.x = POS[16]\n\
elseif StrEnigma[1] == "k" then\n\
p.x = POS[4]\n\
elseif StrEnigma[1] == "f" then\n\
p.x = POS[1]\n\
end\n\
for i =2, #StrEnigma do\n\
if StrEnigma[i] == "w" then\n\
if p.x == 4 or p.x == 8 or p.x == 12 or p.x == 16 then\n\
p.x =  (POS[p.x] - 3)\n\
else\n\
p.x = POS[p.x] + 1\n\
end\n\
elseif StrEnigma[i] == "y" then\n\
if p.x == 13 or p.x == 14 or p.x == 15 or p.x == 16 then\n\
p.x =  (POS[p.x] - 12)\n\
else\n\
p.x = POS[p.x] + 4\n\
end\n\
elseif StrEnigma[i] == "m" then\n\
if p.x == 1 or p.x == 2 or p.x == 3 or p.x == 4 then\n\
p.x =  (POS[p.x] + 12)\n\
else\n\
p.x =  (POS[p.x] - 4)\n\
end\n\
elseif StrEnigma[i] == "g" then\n\
if p.x == 1 or p.x == 5 or p.x == 9 or p.x == 13 then\n\
p.x =  (POS[p.x] + 3)\n\
else\n\
p.x =  (POS[p.x] - 1)\n\
end\n\
end\n\
end\n\
return POS[p.x]\n\
end\n\
\n\
function desenharArms(x)\n\
local a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p = " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "\n\
if x == 1 then\n\
a = "x"\n\
elseif x == 2 then\n\
b = "x"\n\
elseif x == 3 then\n\
c = "x"\n\
elseif x == 4 then\n\
d = "x"\n\
elseif x == 5 then\n\
e = "x"\n\
elseif x == 6 then\n\
f = "x"\n\
elseif x == 7 then\n\
g = "x"\n\
elseif x == 8 then\n\
h = "x"\n\
elseif x == 9 then\n\
i = "x"\n\
elseif x == 10 then\n\
j = "x"\n\
elseif x == 11 then\n\
k = "x"\n\
elseif x == 12 then\n\
l = "x"\n\
elseif x == 13 then\n\
m = "x"\n\
elseif x == 14 then\n\
n = "x"\n\
elseif x == 15 then\n\
o = "x"\n\
elseif x == 16 then\n\
p = "x"\n\
end\n\
des = "-------------------------\n[ "..a.." | "..b.." ]       [ "..c.." | "..d.." ]\n[ "..e.." | "..f.." ]       [ "..g.." | "..h.." ]\n[ "..i.." | "..j.." ]       [ "..k.." | "..l.." ]\n[ "..m.." | "..n.." ]       [ "..o.." | "..p.." ]\n-------------------------"\n\
print(des)\n\
end\n\
--Interagir\n\
io.write("Qual o enigma?\n")\n\
codigo = io.read()\n\
desenharArms(decifrarEnigma(codigo))\n\
io.read()\n\
\n';
  
  /* ****************************************************************** */
  
  function luaSyntaxParser(code) {
    if(typeof(code) !== 'string') return false;
    code = luaSyntaxParser._skipUTF8BOM(code);
    return luaSyntaxParser.chunk(code);
  };
  
  /* ****************************************************************** */
  i=0;
  luaSyntaxParser.chunk = function(code) {
    if(i++>100) throw new Error('More than 100 loops.');
    code = luaSyntaxParser._skipSpaces(code);
    var chunks = [];
    var chunk;
    
    chunk = luaSyntaxParser.comment(code);
    if(chunk.success) {
      code = chunk.success.code;
      delete chunk.success.code;
      
      chunks.push(chunk.success);
      
      var next_chunk = luaSyntaxParser.chunk(luaSyntaxParser._skipSpaces(code));
      if(next_chunk.success) {
        code = next_chunk.success.code;
        delete next_chunk.success.code;
        chunks.push(next_chunk.success);
      }
      
      return {
        success: {
          type: 'chunk',
          chunks: chunks,
          code: luaSyntaxParser._skipSpaces(code)
        }
      };
    }
    
    chunk = luaSyntaxParser.variableAssignment(code);
    if(chunk.success) {
      code = chunk.success.code;
      delete chunk.success.code;
      
      chunks.push(chunk.success);
      
      var next_chunk = luaSyntaxParser.chunk(luaSyntaxParser._skipSpaces(code));
      if(next_chunk.success) {
        code = next_chunk.success.code;
        delete next_chunk.success.code;
        chunks.push(next_chunk.success);
      }
      
      return {
        success: {
          type: 'chunk',
          chunks: chunks,
          code: luaSyntaxParser._skipSpaces(code)
        }
      };
    }
    
    return {};
    // console.log(chunks, i, show(code));
    // if(i === 1) luaSyntaxParser.chunk(code, chunks);
    // if(i === 2) luaSyntaxParser.chunk(code, chunks);
    // return chunks;
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
          arguments: ['Unexpected symbol "' + string.code[0] + '", it should be "--".']
        }
      };
    
    return {
      success: {
        type: 'comment-long',
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
    
    return {};
    var expressions_list = luaSyntaxParser.expressionsList(code);
    if(!variable.success) return variable.error || variable;
    
  };
  
  luaSyntaxParser.variablesList = function(code) {
    var table = luaSyntaxParser.variableTable(code);
    if(table.success) return table;
    
    var name = luaSyntaxParser.variableName(code);
    if(name.success) return name;
    
    return {};
  };
  
  luaSyntaxParser.variableTable = function(code) {
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return name.error || name;
    
    code = name.success.code;
    delete name.success.code;
    code = luaSyntaxParser._skipSpaces(code);
    
    if(code[0] === '[') {
      name.success.type = 'table';
      code = luaSyntaxParser._skipSpaces(code.substr(1));
      
      var expression = luaSyntaxParser.expression(code);
      if(!expression.success) return expression.error || expression;
      
      code = expression.success.code;
      delete expression.success.code;
      name.success.sub_expression = expression.success;
    }
    
    console.log(show(code));
    console.log(1, name);
    
    return name;
    
    // code = name.success.code;
    // delete name.success.code;
    // code = luaSyntaxParser._skipSpaces(code);
    
    // var expression;
    // if(code[0] === '[') {
      // expression = luaSyntaxParser.expression(code.substr(1));
      // console.log(expression);
    // };
    
    // console.log(name, expression, code.substr(0, 10));
    // return;
    // var variable_name
      // , variable_names = []
    // ;
    
    // if(!luaSyntaxParser._name(code))
      // return {
        // variable_names: variable_names,
        // code: code
      // };
    
    // variable_name = RegExp['$&'];
    // code = luaSyntaxParser._skipSpaces(code.substr(variable_name.length));
    
    // if(code[0] === ',') {
      // variable_names.push({
        // type: 'simple-variable',
        // name: variable_name
      // });
      
      // code = luaSyntaxParser._skipSpaces(code.substr(1));
      // var next = luaSyntaxParser.variablesList(code);
      // code = next.variable_names.length === 0 ? ',' + code : next.code;
      // variable_names.push.apply(variable_names, next.variable_names);
      
    // } else if(code[0] === '[') {
      // code = luaSyntaxParser._skipSpaces(code.substr(1));
      // var next = luaSyntaxParser.expression(code);
      
      // if(next.type === 'expression-nil')
        // throw new ReferenceError('Expression "' + variable_name + '[nil]" is not allowed.');
      
      // if(next.type === 'expression-vararg')
        // throw new ReferenceError('Expression "' + variable_name + '[...]" is not allowed.');
      
      // code = luaSyntaxParser._skipSpaces(next.code);
      
      // if(code[0] !== ']') throw new SyntaxError('Unexpected symbol "' + code[0] + '", it should be "]".');
      
      // code = luaSyntaxParser._skipSpaces(code.substr(1));
      // delete next.code;
      
      // variable_names.push({
        // type: 'complex-variable',
        // name: variable_name,
        // branch: next
      // });
      
      
    // } else if(code[0] === '.') {
      // code = luaSyntaxParser._skipSpaces(code.substr(1));
      // var next = luaSyntaxParser.variablesList(code);
      
      // if(next.variable_names.length === 0)
        // throw new SyntaxError('Unexpected symbol "' + code[0] + '".');
      
      // code = next.code;
      // var branch = next.variable_names[0];
      // variable_names.push({
        // type: 'complex-variable',
        // name: variable_name,
        // branch: branch
      // });
      // variable_names.push.apply(variable_names, next.variable_names.slice(1));
      
    // } else {
      // variable_names.push({
        // type: 'simple-variable',
        // name: variable_name
      // });
      
    // }
    
    // return {
      // variable_names: variable_names,
      // code: code
    // };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.variableName = function(code) {
    var name = code.match(/^[a-z_]\w*/i);
    return name === null
      ? {}
      : {
          success: {
            type: 'name',
            value: name[0],
            code: luaSyntaxParser._skipSpaces(code.substr(name[0].length))
          }
        }
    ;
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser.expression = function(code) {
    var expression = luaSyntaxParser.nil(code);
    if(expression.success) return expression;
    
    expression = luaSyntaxParser.true(code);
    if(expression.success) return expression;
    
    expression = luaSyntaxParser.false(code);
    if(expression.success) return expression;
    
    expression = luaSyntaxParser.number(code);
    if(expression.success) return expression;
    
    expression = luaSyntaxParser.string(code);
    if(expression.success) return expression;
    
    expression = luaSyntaxParser.anonymousFunction(code);
    if(expression.success) return expression;
  };
  
  luaSyntaxParser.nil = function(code) {
    var nil = code.match(/^nil\W/);
    return nil === null
      ? {}
      : {
          success: {
            type: 'nil',
            code: code.substr(3)
          }
        }
    ;
  };
  
  luaSyntaxParser.true = function(code) {
    var True = code.match(/^true\W/);
    return True === null
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
    var False = code.match(/^false\W/);
    return False === null
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
    var number = code.match(/^[+-]?(?:0x[a-f0-9]+|[0-9]+(?:.[0-9]+)?(?:e[+-]?[0-9]+)?)/i);
    return number === null 
      ? {}
      : {
          success: {
            type: 'number',
            value: number[0],
            code: code.substr(number[0].length)
          }
        }
    ;
  };
  
  luaSyntaxParser.anonymousFunction = function(code) {
    if(code.match(/^function\W/) === null) return {};
    
    code = luaSyntaxParser._skipSpaces(code.substr(RegExp['$&'].length));
    if(code[0] !== '(')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be "(".']
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var arguments_list = luaSyntaxParser.argumentsList(code);
    
    if(arguments_list.success) {
      code = arguments_list.success.code;
      delete arguments_list.success.code;
      arguments_list = arguments_list.success;
    } else
      arguments_list = {};
    
    if(code[0] !== ')')
      return {
        error: {
          type: SyntaxError,
          arguments: ['Unexpected symbol "' + code[0] + '", it should be ")".']
        }
      };
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var body = luaSyntaxParser.functionBody(code);
    console.log(show(code));
    
    return {
      success: {
        type: 'anonymous-function',
        arguments_list: arguments_list,
        body: body,
        code: code
      }
    };
  };
  
  luaSyntaxParser.argumentsList = function(code) {
    if(code.match(/^\.\.\./))
      return {
        success: {
          type: 'argument-three-dots',
          code: code.substr(3)
        }
      };
    
    var name = luaSyntaxParser.variableName(code);
    if(!name.success) return {};
    
    code = name.success.code;
    delete name.success.code;
    var argument_names = [name.success];
    
    if(code[0] === ',') {
      var next_name = luaSyntaxParser.argumentsList(luaSyntaxParser._skipSpaces(code.substr(1)));
      if(next_name.success) {
        code = next_name.success.code;
        delete next_name.success.code;
        argument_names.push(next_name.success);
      }
    }
    
    return {
      success: {
        type: 'argument-names',
        argument_names: argument_names,
        code: luaSyntaxParser._skipSpaces(code)
      }
    };
  };
  
  luaSyntaxParser.functionBody = function(code) {
    var chunk = luaSyntaxParser.chunk(code, []);
    console.log(chunk);
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
    if(!code.match(/^['"]/)) return {};
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
      
      if(tmp[tmp.length - 1] !== '\\')
        break;
      
      string += delimiter;
      code = code.substr(1);
    }
    string += code.substr(0, 1);
    
    return {
      success: {
        type: 'string-short',
        value: string,
        code: code.substr(string.length)
      }
    };
  };
  
  luaSyntaxParser.stringLong = function(code) {
    var string_level = code.match(/^(\[(=*)\[)/) && RegExp.$2;
    if(string_level === null) return {};

    var string_begin = RegExp.$1
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
        value: string,
        code: code.substr(string.length)
      }
    };
  };
  
  /* ****************************************************************** */
  
  luaSyntaxParser._expression = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    var expression;
    
    if(expression = luaSyntaxParser._isString(code)) {
      return {
        type: 'expression-' + (expression[0] === '[' ? 'long-' : '') + 'string',
        value: expression,
        code: code.substr(expression.length)
      };
      
    } else if(expression = luaSyntaxParser._isBoolean(code)) {
      return {
        type: 'expression-boolean',
        value: expression,
        code: code.substr(expression.length)
      };
      
    } else if(expression = luaSyntaxParser._isNumber(code)) {
      return {
        type: 'expression-number',
        value: expression,
        code: code.substr(expression.length)
      };
      
    } else if(expression = luaSyntaxParser._isNil(code)) {
      return {
        type: 'expression-nil',
        value: expression,
        code: code.substr(expression.length)
      };
      
    } else if(expression = luaSyntaxParser._isAnonymousFunction(code)) {
      return {
        type: 'expression-anonymous-function',
        value: expression,
        code: expression.code
      };
      
    } else if(expression = luaSyntaxParser._isVararg(code)) {
      return {
        type: 'expression-vararg',
        value: expression,
        code: code.substr(expression.length)
      };
      
    }
    
    throw new SyntaxError('Unexpected symbol "' + code[0] + '".');
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
  
  luaSyntaxParser._isNumber = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    return /^([+-]?(?:0x[a-f0-9]+|[0-9]+(?:.[0-9]+)?(?:e[+-]?[0-9]+)?))/i.exec(code) && RegExp.$1;
  };
  
  luaSyntaxParser._isBoolean = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    return /^(true|false)/.exec(code) && RegExp.$1;
  };
  
  luaSyntaxParser._isNil = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    return 0 === code.indexOf('nil') && 'nil';
  };
  
  luaSyntaxParser._isString = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    var string = false, tmp;
    
    if(code[0] === '"' || code[0] === "'") {
      var delimiter = code[0]
        , regex = RegExp('^[^' + delimiter + '\\r\\n]+')
      ;
      string = code.substr(0, 1);
      code = code.substr(1);
      
      while(tmp = code.match(regex) && RegExp['$&']) {
        if(code[tmp.length] === '\r' || code[tmp.length] === '\n')
          throw new SyntaxError('Unexpected new line "' + code.substr(0, tmp.length + 1) + '".');
        
        string += tmp;
        code = code.substr(tmp.length);
        
        if(tmp[tmp.length - 1] !== '\\')
          break;
        
        string += delimiter;
        code = code.substr(1);
      }
      string += code.substr(0, 1);
      
    } if(code[0] === '[') {
      var string_level = code.match(/^(\[(=+)?\[)/) && RegExp.$2 || ''
        , string_begin = RegExp.$1
        , string_end = ']' + string_level + ']'
        , string_end_index = code.indexOf(string_end)
      ;
      
      if(!~string_end_index) throw new SyntaxError('End of string "' + string_begin + '" not found.')
      string = code.substr(0, string_end_index + string_end.length);
    }
    
    return string;
  };
  
  luaSyntaxParser._isVararg = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    return /^\.{3}/.exec(code) && RegExp['$&'];
  };
  
  luaSyntaxParser._name = function(code) {
    return luaSyntaxParser._skipSpaces(code).match(/^[a-z_]\w*/i);
  };
  
  luaSyntaxParser._isAnonymousFunction = function(code) {
    code = luaSyntaxParser._skipSpaces(code);
    if(!/^function/.test(code)) return false;
    
    code = luaSyntaxParser._skipSpaces(code.substr(8));
    if(!/^\(/.test(code)) return false;
    
    var arguments_list = luaSyntaxParser.argumentsList(luaSyntaxParser._skipSpaces(code.substr(1)));
    
    code = arguments_list.code;
    if(code[0] !== ')') return false;
    
    code = luaSyntaxParser._skipSpaces(code.substr(1));
    var block = luaSyntaxParser.block(code);
    
    return {
      arguments_list: arguments_list,
      block: block,
      code: code
    };
  };
  
  /* ****************************************************************** */

  console.info(luaSyntaxParser(js_lua_code.value));
// }()
