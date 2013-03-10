Mockle.module('TemplateDirectory', [], {
  initialize: function() {
    this.pending = 1;
    this.loading = {};
    this.loaded = {};
    this.templates = {};
  },

  start: function() {
    if (--this.pending == 0) this.done();
  },

  load: function() {
    throw "load must be overriden";
  },

  define: function(name, template) {
    this.templates[name] = template;
    this.loaded[name] = true;

    if (this.loading[name]) {
      this.start();
      delete this.loading[name];
    }
  },

  require: function(name) {
    if (this.loaded[name] || this.loading[name]) return;
    this.loading[name] = true;
    this.pending++;
    this.load(name);
  }
});

