Mockle.module('Source', [], {
  initialize: function() {
    document.write('<style>*{display:none !important}</style>');
    document.write('<noframes id="_mockle_tmpl">');
  },

  fetch: function() {
    var frame = document.getElementById('_mockle_tmpl');
    if (frame.innerText) return frame.innerText;

    var req = window.ActiveXObject
      ? new ActiveXObject('Microsoft.XMLHTTP')
      : new XMLHttpRequest();

    req.open("GET", location.href, false);
    req.send();

    var text = req.responseText;
    var match = text.match(/^([\S\s]*?)<script([^>]*)>([\S\s]*?)<\/script>([\S\s]*)$/);
    if (match) {
      return match[4];
    }
  },

  get: function() {
    if (!this.source) this.source = this.fetch() || ' ';
    return this.source;
  }
});

