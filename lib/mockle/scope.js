Mockle.module('Scope', [], {
  initialize: function() {
    this.layers = [];
  },

  push: function(value) {
    this.layers.push(value);
  },

  pop: function() {
    this.layers.pop();
  },

  find: function(name) {
    var levels = this.layers.length;

    while (levels--) {
      var obj = this.layers[levels];
      var value = this.lookup(name, obj);
      if (typeof value != 'undefined') return value;
    }
  },

  lookup: function(name, base) {
    if (typeof base != 'object') return;
    var value = base[name];
    return value;
  },

  partial: function(name, scope) {
    var tmpl = this.directory.templates[name];
    return tmpl.render(scope);
  },

  sub: function() {
    var sub = Mockle.Scope.create();
    sub.push(this.layers[0]);
    sub.directory = this.directory;
    return sub;
  }
});

