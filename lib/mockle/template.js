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
  }
});


