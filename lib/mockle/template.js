Mockle.module('Template', [], {
  initialize: function(source) {
    this.source = source;
    this.errors = [];
    this.partials = [];
    this.ast = this.parse();
  },

  err: function(pos, msg) {
    this.errors.push({pos: pos, message: msg});
  },

  parse: function() {
    var res = []
      , str = this.source
      , re = /@([\w.]+)(\((.*?)\))?/g
      , start = 0
      , stack = []
      , endTag, tmp
      , exp
      , match;

    while (match = re.exec(str)) {
      if (tmp = str.substring(start, match.index)) {
        res.push({type: "str", value: tmp});
      }

      start = re.lastIndex;

      if (match[1] == "if") {
        exp = {
          pos: start,
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
          pos: start,
          type: "for",
          code: []
        };

        this.parseFor(match[3], exp);

        stack.push([res, exp]);
        res.push(exp);
        res = exp.code;

      } else if (endTag = match[1].match(/^end(.*)$/)) {
        tmp = stack.pop();

        if (!tmp) {
          this.err(start, 'Unexpected '+match[0]+', no block open');
          return;
        }

        if (tmp[1].type != endTag[1]) {
          this.err(tmp[1].pos, '@'+tmp[1].type + " starts here, doesn't end");
          this.err(start, 'Unexpected '+match[0]+', expected @end'+tmp[1].type);
          return;
        }

        res = tmp[0];
      } else if (match[2]) {
        exp = {
          pos: start,
          type: "partial",
          name: match[1]
        }

        if (this.partials.indexOf(exp.name) == -1) {
          this.partials.push(exp.name);
        }

        res.push(exp);
      } else {
        var exp = this.parseExpr(match[1]);
        exp.pos = start;
        res.push(exp);
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
    exp.base.pos = exp.pos + match[1] + 4;
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
    if (!this.ast) return;
    return this.process(this.ast, data);
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
      } else if (node.type == "partial") {
        var tmpl = template.templates[node.name];
        if (!tmpl) return template.err(node.pos, "No such partial: " + node.name);
        str += tmpl.render(data);
      } else {
        template.err(node.pos, "Unknown node: " + node.type);
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


