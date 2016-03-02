-function() {
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
  
  // This program reads a lua source code and formats it
  // It's based on <http://migre.me/mEbec>
  
      // Spaces or tabs or even other strings
  var indentation = "  "
    , js_lua_code = document.querySelector("#js_lua_code")
    , js_lua_beautify = document.querySelector("#js_lua_beautify")
  ;
  js_lua_code.value = '--Variaveis\n\
POS = {1,  2,  3,  4,\n\
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
  
  // Checks if a string (self) starts with another one (phrase)
  // @param self the original string
  // @param phrase the other string that is supposedly at the beginning of the string
  // @return true or false
  function startsWith(self, phrase) {
    return phrase.length && self.length && !self.indexOf(phrase);
  }
  
  // Checks if a string (self) starts with another one (phrase)
  // @param self the original string
  // @param phrase the other string that is supposedly at the end of the string
  // @return true or false
  function endsWith(self, phrase) {
    var last_index_of = self.lastIndexOf(phrase);
    return phrase.length && self.length && ~last_index_of && (last_index_of === self.length - phrase.length);
  }
  
  // Removes whitespace from both ends of the string
  // @param self the string
  // @return string
  function trim(self) {
    return self.replace(/^\s+|\s+$/g, "");
  }
  
  // Repeats a string n times
  // @param self the string
  // @param times number
  // @return string
  function repeat(self, times) {
    times |= 0;
    if(times < 1) return "";
    var copy = self;
    while(--times) self += copy;
    return self;
  }
  
  // Beautify the Lua code
  // @param string the code to beautify
  // @param indentation the base string used for indentation
  // @return string
  function luaBeautifier(string, indentation) {
    var current_indentation = 0
      , next_indentation = 0
    ;
    
    return string.split(/\r?\n/).map(function(line) {
      line = trim(line);
      
      current_indentation = next_indentation;
      
      // Entering in a block
      if(
        startsWith(line, "local function") ||
        startsWith(line, "function") ||
        startsWith(line, "repeat") ||
        startsWith(line, "while") ||
        endsWith(line, "then") ||
        endsWith(line, "do") ||
        endsWith(line, "{")
      ) next_indentation = current_indentation + 1;
      
      // Leaving a block
      if(line === "end" || startsWith(line, "}") || startsWith(line, "until")) {
        current_indentation--;
        next_indentation = current_indentation;
      }
      
      // Entering in a block but this line must be pushed back
      if(startsWith(line, "else") || startsWith(line, "elseif")) {
        current_indentation--;
        next_indentation = current_indentation + 1;
      }
      
      return !line ? "" : repeat(indentation, current_indentation) + line;
    }).join("\n");
  }
  
  js_lua_code.addEventListener("keydown", function(e) {
    // If Ctrl + Enter then beautify
    if(e.ctrlKey && e.keyCode === 13) js_lua_beautify.click();
  });
  
  js_lua_beautify.addEventListener("click", function() {
    js_lua_code.value = luaBeautifier(js_lua_code.value, indentation);
    js_lua_code.focus();
  });
  
  js_lua_code.focus();
}()
