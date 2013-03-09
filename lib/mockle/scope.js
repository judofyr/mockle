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
    var value = base[name];
    return value;
  }
});

