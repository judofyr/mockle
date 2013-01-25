Mockle.module('Browser', ['mockie', 'Template'], {
  setup: function() {
    // Capture the rest of the page
    document.write('<style>*{display:none !important}</style>');
    document.write('<textarea id="_mockle_tmpl">');

    var element = Mockie.element;

    this.templates = {};
    this.templateQueue = {};
    this.templateQueue.loaded = {};
    this.templateQueue.pending = 1;

    this.data = {};
    this.defs = {};
    this.root = element.src.replace(/\/[^\/]+$/, '/');

    var me = this;
    Mockle.config = function(cb) {
      cb(me);

      var use = Mockie.config.use;
      if (use) use = use.split(' ');
      
      for (var i = 0; use && i < use.length; i++) {
        var res = me.defs[use[i]]();
        if (res) me.merge(res);
      }

      me.start();
    };

    var cfg = document.createElement('script');
    cfg.src = this.path("mockle.config.js");
    element.parentNode.appendChild(cfg);
  },

  path: function(str) {
    return this.root + str;
  },

  merge: function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.data[key] = obj[key];
      }
    }
  },

  def: function(name, fn) {
    this.defs[name] = fn;
  },

  fetchSource: function() {
    var tmpl = document.getElementById('_mockle_tmpl');
    return tmpl.value;
  },

  fetchTemplate: function(name) {
    var me = this
      , queue = me.templateQueue

    if (queue.loaded[name]) return;

    queue.loaded[name] = 1;
    queue.pending++;

    Mockie.request(me.path(name), 'source', function(source) {
      me.addTemplate(name, source);
      if (--queue.pending == 0) me.renderEverything();
    });
  },

  addTemplate: function(name, source) {
    var me = this;
    var tmpl = Mockle.Template.create(source);
    me.templates[name] = tmpl;

    tmpl.partials.forEach(function(partial) {
      me.fetchTemplate(partial);
    });
  },

  start: function() {
    var me = this;
    var source = this.fetchSource();

    Mockie.expose({
      source: function(cb) { cb(source) }
    });

    this.addTemplate('main', source);

    if (Mockie.config.layout) {
      this.fetchTemplate(Mockie.config.layout);
    }

    if (--this.templateQueue.pending == 0) this.renderEverything();
  },

  renderEverything: function() {
    var tmpl = this.templates.main;
    var res = tmpl.render(this.data);
    console.log(res);
  },

  render: function(source, data) {
    var template = Mockle.Template.create(source);
    var res = template.render(data);

    if (template.errors.length) {
      this.reportError(source, template.errors);
      throw 'err';
    }

    return res;
  },

  reportError: function(source, errors) {
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
      , res = style + "<pre>" + lineStart + '<div class="no">1</div>'
      , extras = ""
      , str, lines
      , err
      , start = 0
      , lineno = 1
      , i
      , me = this

    var write = function(str) {
      var lines = str.split("\n");
      var last = lines.pop();

      for (var j = 0; j < lines.length; j++) {
        res += me.escapeHTML(lines[j]);
        res += lineStop;
        lineno += 1;
        res += extras;
        extras = "";
        res += lineStart;
        res += '<div class="no">'+lineno+'</div>';
      }

      res += me.escapeHTML(last);
    };

    for (i = 0; i < errors.length; i++) {
      err = errors[i];
      write(source.substring(start, err.pos));

      extras += '<div class="error">' + this.escapeHTML(err.message) + '</div>';
      start = err.pos;
    }

    write(source.substring(start));
    res += lineStop;

    this.write(res);
  },

  escapeHTML: function(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  },

  write: function(str) {
    document.open();
    document.write('<!DOCTYPE html>' + str);
    document.close();
  }
});

