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

      case 'text':
        return ast[1];

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

  process: function(ast, data) {
    var template = this
      , str = "";

    ast.forEach(function(node) {
      if (node.type == "str") {
        str += node.value;
      } else if (node.type == "var") {
        str += template.value(node, data, node.pos);
      } else if (node.type == "if") {
        if (template.value(node.cond, data, node.pos)) {
          str += template.process(node.tb, data);
        } else if (node.fb) {
          str += template.process(node.fb, data);
        }
      } else if (node.type == "for") {
        var list = template.value(node.base, data);
        list.forEach(function(ele) {
          data[node.name] = ele;
          str += template.process(node.code, data);
        });
      }
    });
    return str;
  },

  value: function(exp, data, pos) {
    var base = data;
    for (var i = 0; i < exp.path.length; i++) {
      var key = exp.path[i];

      if (typeof base[key] == 'undefined') {
        var str = exp.path.slice(0, i).join('.');
        if (str) str = ' in '+str;
        this.err(pos, 'Missing "'+key+'"'+str);
        return;
      }
      
      base = base[key];
    }

    return base;
  }
});


