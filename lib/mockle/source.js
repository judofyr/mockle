Mockle.module('Source', ['mockie'], {
  initialize: function() {
    document.write('<style>*{display:none !important}</style>');
    document.write('<noframes id="_mockle_tmpl">');
  },

  get: function() {
    if (!this.source) this.source = this.fetchSelf() || '(could not extract template)';
    return this.source;
  },

  fetchSelf: function() {
    var frame = document.getElementById('_mockle_tmpl');
    if (frame.innerText) return frame.innerText;

    var req = window.ActiveXObject
      ? new ActiveXObject('Microsoft.XMLHTTP')
      : new XMLHttpRequest();

    req.open("GET", location.href, false);
    req.send();
    return this.extract(req.responseText);
  },

  fetch: function(src, cb) {
    var me = this;
    var req = window.ActiveXObject
      ? new ActiveXObject('Microsoft.XMLHTTP')
      : new XMLHttpRequest();

    try {
      req.open("GET", src, true);
      req.send();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          if (req.status != 200) {
            cb("HTTP " + req.status);
          } else {
            cb(null, me.extract(req.responseText));
          }
        }
      }
    } catch (err) {
      Mockie.request(src, 'source', cb);
    }
  },

  extract: function(text) {
    var match = text.match(/^([\S\s]*?)<script([^>]*)>([\S\s]*?)<\/script>([\S\s]*)$/);
    if (match) {
      return match[4];
    }
  }
});

