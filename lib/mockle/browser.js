Mockle.module('Browser', ['mockie', 'Source', 'Template', 'Scope', 'TemplateDirectory'], {
  setup: function() {
    var element = Mockie.element;
    this.data = {};
    this.defs = {};
    this.root = element.src.replace(/(^|\/)[^\/]+$/, '$1');
    this.name = location.toString().substring(this.root.length);

    var me = this;
    Mockle.config = function(cb) {
      cb(me);

      var use = Mockie.config.use;
      if (use) use = use.split(' ');
      
      for (var i = 0; use && i < use.length; i++) {
        var res = me.defs[use[i]]();
        if (res) me.merge(res);
      }
    };

    document.write('<script src="'+this.path('mockle.config.js')+'"></script>');
    this.source = Mockle.Source.create();

    window.onload = function() {
      me.start();
    };
  },

  path: function(str) {
    return this.root + str;
  },

  defaults: function(obj) {
    this.merge(obj);
  },

  merge: function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.data[key] = obj[key];
      }
    }
  },

  define: function(name, fn) {
    if (typeof fn != 'function') {
      var me = this, obj = fn;
      fn = function() { me.merge(obj) };
    };
    this.defs[name] = fn;
  },

  html: function(str) {
    var obj = Object(str);
    obj.html_safe = true;
    return obj;
  },

  start: function() {
    var me = this;
    var source = this.source;

    Mockie.expose({
      source: function(cb) { cb(source.get()) }
    });

    var layout = Mockie.config.layout;
    var dir = Mockle.TemplateDirectory.create();

    dir.load = function(name) {
      me.source.fetch(name, function(err, source) {
        if (err) return alert(name + " failed: " + err);
        dir.defineTemplate(name, source);
      });
    };

    dir.done = function() {
      me.process(me.name, dir, layout);
    };

    if (layout) {
      dir.require(layout);
    }

    dir.defineTemplate(this.name, source.get());
    dir.start();
  },

  process: function(name, dir, layout) {
    var scope = Mockle.Scope.create();
    scope.directory = dir;
    scope.push(this.data);
    var tmpl = dir.templates[name];

    try {
      var res = tmpl.render(scope);
      if (layout) {
        scope.push({content: this.html(res)});
        res = dir.templates[layout].render(scope);
      }
    } catch (err) {
      res = this.reportError(err.template, err.msg, err.loc);
    }

    this.write(res);
  },

  reportError: function(tmpl, msg, loc) {
    var style = "<style>"+
      ".error { "+
        "background-color: #FF6B6B;"+
        "padding: 5px 10px;"+
      "} "+
      ".no { float: left; width: 10px; padding: 0 20px; text-align: right; color: #999 }"+
      ".line { clear: both; line-height: 1.5; height: 1.5em; border-bottom: 1px solid #eee }"+
      "</style>"
      , lineStart = '<div class="line">'
      , lineStop = '</div>'
      , lineMiddle = lineStop + lineStart
      , res = style + "<pre>" + tmpl.name + "<br>"
      , lines = tmpl.source.split("\n")

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var lineno = i + 1;
      res += lineStart + '<div class="no">'+ lineno +'</div>'
      res += this.escapeHTML(line)
      res += lineStop;

      if (loc.first_line == lineno) {
        res += lineStart + '<div class="no">&nbsp;</div>'
        res += Array(loc.first_column).join('&nbsp;');
        res += '<span class="error">'+msg+'</span>';
        res += lineStop;
      }
    }

    return res;
  },

  escapeHTML: function(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  },

  write: function(str) {
    setTimeout(function() {
      document.open();
      document.write('<!DOCTYPE html>' + str);
      document.close();
    });
  }
});

