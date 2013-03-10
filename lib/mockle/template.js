Mockle.module('Template', ['Parser'], {
  initialize: function(source) {
    this.source = source;
    this.ast = Mockle.Parser.parse(source);
  },

  render: function(scope) {
    return this.evaluate(this.ast, scope);
  },

  evaluate: function(ast, scope) {
    switch (ast[0]) {
      case 'contents':
        var res = "";
        for (var i = 1; i < ast.length; i++) {
          res += this.evaluate(ast[i], scope) || '';
        }
        return res;

      case 'html':
        return ast[1];

      case 'text':
        var value = this.evaluate(ast[1], scope);
        if (value && !value.html_safe) {
          return this.escape(value);
        }
        return value;

      case 'lookup':
        if (ast[2]) {
          return scope.lookup(ast[1], this.evaluate(ast[2], scope));
        } else {
          return scope.find(ast[1]);
        }

      case 'for':
        var value = this.evaluate(ast[2], scope);
        if (value && value.length) {
          var res = "", env = {};
          scope.push(env);
          for (var i = 0; i < value.length; i++) {
            env[ast[1]] = value[i];
            res += this.evaluate(ast[3], scope);
          }
          scope.pop();
          return res;
        }

        if (ast[4]) {
          return this.evaluate(ast[4], scope);
        }

        return;

      case 'if':
        var cond = this.evaluate(ast[1], scope);
        if (cond) {
          return this.evaluate(ast[2], scope);
        }

        if (ast[3]) {
          return this.evaluate(ast[3], scope);
        }

        return;

      case 'call':
        var sub = scope.sub();
        var locals = {};
        sub.push(locals);
        for (var i = 0; i < ast[2].length; i++) {
          var arg = ast[2][i];
          locals[arg[1]] = this.evaluate(arg[2], scope);
        }
        return scope.partial(ast[1], sub);
      
      default:
        throw 'Unhandled: ' + ast[0];
    }
  },

  escape: function(str) {
    return str
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g, '&quot;');
  },

  extractPartials: function(dir, ast) {
    ast = ast || this.ast;

    switch (ast[0]) {
      case 'contents':
        for (var i = 1; i < ast.length; i++) {
          this.extractPartials(dir, ast[i]);
        }
        return;

      case 'html':
      case 'text':
      case 'lookup':
        return;

      case 'for':
        this.extractPartials(dir, ast[3]);
        if (ast[4]) {
          this.extractPartials(dir, ast[4]);
        }
        return;

      case 'if':
        this.extractPartials(dir, ast[2]);

        if (ast[3]) {
          this.extractPartials(dir, ast[3]);
        }

        return;

      case 'call':
        dir.require(ast[1]);
        return;
      
      default:
        throw 'Unhandled: ' + ast[0];
    }
  }
});


