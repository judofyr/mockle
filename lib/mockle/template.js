Mockle.module('Template', ['Parser'], {
  initialize: function(name, source) {
    this.name = name;
    this.source = source;
  },

  parse: function() {
    var me = this;

    Mockle.Parser.parseError = function(str, data) {
      var loc = {
        first_line: data.loc.last_line,
        first_column: data.loc.last_column
      }
      me.err('Syntax error', loc);
    };

    this.ast = Mockle.Parser.parse(this.source);
  },

  err: function(msg, loc) {
    throw {template: this, msg: msg, loc: loc};
  },

  render: function(scope) {
    return this.evaluate(this.ast, scope);
  },

  evaluate: function(ast, scope) {
    switch (ast.type) {
      case 'contents':
        var res = "";
        for (var i = 0; i < ast.children.length; i++) {
          res += this.evaluate(ast.children[i], scope) || '';
        }
        return res;

      case 'html':
        return ast.value;

      case 'text':
        var value = this.evaluate(ast.value, scope);
        if (value && !value.html_safe) {
          return this.escape(value);
        }
        return value;

      case 'lookup':
        var value;
        if (ast.base) {
          value = scope.lookup(ast.name, this.evaluate(ast.base, scope));
        } else {
          value = scope.find(ast.name);
        }

        if (typeof value == 'undefined') {
          this.err("Undefined value: "+ast.name, ast.loc);
        }

        return value;

      case 'for':
        var value = this.evaluate(ast.expr, scope);
        if (value && value.length) {
          var res = "", env = {};
          scope.push(env);
          for (var i = 0; i < value.length; i++) {
            env[ast.name] = value[i];
            res += this.evaluate(ast.body, scope);
          }
          scope.pop();
          return res;
        }

        if (ast.ebranch) {
          return this.evaluate(ast.ebranch, scope);
        }

        return;

      case 'if':
        var cond = this.evaluate(ast.cond, scope);
        if (cond && typeof cond.length != 'undefined') cond = cond.length;

        if (cond) {
          return this.evaluate(ast.tbranch, scope);
        }

        if (ast.fbranch) {
          return this.evaluate(ast.fbranch, scope);
        }

        return;

      case 'call':
        var sub = scope.sub();
        var locals = {};
        sub.push(locals);
        for (var i = 0; i < ast.args.length; i++) {
          var arg = ast.args[i];
          locals[arg[1]] = this.evaluate(arg[2], scope);
        }
        return scope.partial(ast.name, sub);
      
      default:
        throw 'Unhandled: ' + ast.type;
    }
  },

  escape: function(str) {
    return str
      .toString()
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g, '&quot;');
  },

  extractPartials: function(dir, ast) {
    ast = ast || this.ast;

    switch (ast.type) {
      case 'contents':
        for (var i = 1; i < ast.children.length; i++) {
          this.extractPartials(dir, ast.children[i]);
        }
        return;

      case 'html':
      case 'text':
      case 'lookup':
        return;

      case 'for':
        this.extractPartials(dir, ast.body);
        if (ast.ebranch) {
          this.extractPartials(dir, ast.ebranch);
        }
        return;

      case 'if':
        this.extractPartials(dir, ast.tbranch);

        if (ast.ebranch) {
          this.extractPartials(dir, ast.ebranch);
        }

        return;

      case 'call':
        dir.require(ast.name);
        return;
      
      default:
        throw 'Unhandled: ' + ast[0];
    }
  }
});


