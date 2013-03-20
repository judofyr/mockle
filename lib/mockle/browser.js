Mockle.module('Browser', ['mockie', 'Source', 'Template', 'Scope', 'TemplateDirectory'], {
  setup: function() {
    // Expose the source
    Mockie.expose({
      source: function(cb) {
        var source = Mockle.Source.create()
          , fetchingSource = true;

        window.onload = function() {
          cb(source.get());
        };
      }
    });

    var element = Mockie.element;
    this.data = {};
    this.defs = {};
    this.root = element.src.replace(/(^|\/)[^\/]+$/, '$1');
    this.name = location.toString().substring(this.root.length);
    this.scriptCounter = 0;
    this.configs = [];

    var me = this;
    Mockle.loadedScript = function() { me.loadedScript() };
    Mockle.include = function(str) { me.include(str) };
    Mockle.config = function(cb) { me.configs.push(cb) };

    this.include('mockle.config.js');

    window.onload = function() {
      var factories;
      while (factories = me.configs.shift()) factories(me);

      if (Mockie.config.set)
        me.merge(Mockie.config.set);

      // Invoke defined helpers
      var use = Mockie.config.use;
      if (use) use = use.split(' ');
      
      for (var i = 0; use && i < use.length; i++) {
        var res = me.defs[use[i]]();
        if (res) me.merge(res);
      }

      me.start();
    };
  },

  path: function(str) {
    return this.root + str;
  },

  loadedScript: function() {
    if (--this.scriptCounter == 0) {
      // Only start capturing the source after all scripts have been included.
      this.source = Mockle.Source.create();
    }
  },

  include: function(str) {
    this.scriptCounter++;
    // I heard you like escaping...
    var error = this.escapeHTML('alert("Could not load: "+unescape("'+escape(str)+'"))');
    document.write('<script src="'+this.escapeHTML(this.path(str))+'" onerror="'+error+'"></script>');
    document.write('<script>Mockle.loadedScript()</script>');
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

    dir.error = function(err) {
      var res = me.reportError(err.template, err.msg, err.loc);
      me.write(res);
      throw err.msg;
    };

    dir.defineTemplate(me.name, me.source.get());

    if (layout) dir.require(layout);

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
        res += Array(loc.first_column+1).join('&nbsp;');
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

