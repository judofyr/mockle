Mockle.module('Template', [], {
  initialize: function(source) {
    this.source = source;
    this.ast = this.parse();
  },

  parse: function() {
    var res = []
      , str = this.source
      , re = /@([\w.]+)(\((.*?)\))?/g
      , start = 0
      , stack = []
      , tmp
      , exp
      , match;

    while (match = re.exec(str)) {
      if (tmp = str.substring(start, match.index)) {
        res.push({type: "str", value: tmp});
      }

      start = re.lastIndex;

      if (match[1] == "if") {
        exp = {
          type: "if",
          cond: this.parseExpr(match[3]),
          tb: []
        };

        stack.push([res, exp]);
        res.push(exp);
        res = exp.tb;

      } else if (match[1] == "else") {
        tmp = stack[stack.length-1];

        exp = tmp[1];
        exp.fb = [];
        res = exp.fb;

      } else if (match[1] == "for") {
        exp = {
          type: "for",
          code: []
        };

        this.parseFor(match[3], exp);

        stack.push([res, exp]);
        res.push(exp);
        res = exp.code;

      } else if (/^end/.test(match[1])) {
        tmp = stack.pop();
        res = tmp[0];
      } else {
        res.push(this.parseExpr(match[1]));
      }

    }

    if (tmp = str.substring(start)) {
      res.push({type: "str", value: tmp});
    }

    return res;
  },

  parseFor: function(str, exp) {
    var match = str.match(/^(\w+) in ([\w.]+)$/);
    exp.name = match[1];
    exp.base = this.parseExpr(match[2]);
  },

  parseExpr: function(str) {
    var match = str.match(/^(!?)([\w.]+)$/);
    var exp = {
      type: "var",
      path: match[2].split(".")
    };

    if (match[1]) {
      exp = {
        type: "not",
        exp: exp
      }
    }

    return exp;
  },

  render: function(data) {
    return this.process(this.ast, data);
  },

  process: function(ast, data) {
    var template = this
      , str = "";

    ast.forEach(function(node) {
      if (node.type == "str") {
        str += node.value;
      } else if (node.type == "var") {
        str += template.value(node, data);
      } else if (node.type == "if") {
        if (template.value(node.cond, data)) {
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

  value: function(exp, data) {
    var base = data;
    exp.path.forEach(function(key) {
      if (base) base = base[key];
    });
    return base;
  }
});


