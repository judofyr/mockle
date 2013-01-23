Mockle.module('Browser', ['mockie', 'Template'], {
  setup: function() {
    // Capture the rest of the page
    document.write('<style>*{display:none !important}</style>');
    document.write('<textarea id="_mockle_tmpl">');

    var element = Mockie.element;
    this.data = {};
    this.defs = {};
    this.root = element.src.replace(/\/[^\/]+$/, '/');

    var me = this;
    Mockle.config = function(cb) {
      cb(me);

      var use = element.getAttribute('use');
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

  start: function() {
    var me = this;
    var source = this.fetchSource();

    Mockie.expose({
      source: function(cb) { cb(source) }
    });

    if (Mockie.config.layout) {
      Mockie.request(Mockie.config.layout, 'source', function(layout) {
        me.process(source, layout);
      });
    } else {
      me.process(source);
    }
  },

  process: function(source, layout) {
    console.log(source);
    var res = this.render(source, this.data);
    this.data.content = res;
    if (layout) res = this.render(layout, this.data);
    console.log(res);
    this.write(res);
  },

  render: function(source, data) {
    var template = Mockle.Template.create(source);
    return template.render(data);
  },

  write: function(str) {
    document.open();
    document.write('<!DOCTYPE html>' + str);
    document.close();
  }
});

