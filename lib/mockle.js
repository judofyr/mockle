var Mockle;

(function() {
  var dep;
  // dep.js
  (dep=function(a){function e(b){var d=c[b];d?(c[b]=0,d()):a.load&&a.load(b)}var b=a.loaded={},c={},d={};return a.use=function(a,c){typeof a=="string"&&(a=[a]);var f=a.length+1,g,h=function(){--f==0&&c&&c()};h();while(g=a.shift())b[g]?h():((d[g]||(d[g]=[])).push(h),e(g))},a.define=function(f,g,h){c[f]=function(){a.use(g||[],function(){var a,c=d[f];b[f]=1,h&&h();while(a=c&&c.shift())a()})},d[f]&&e(f)},a})(dep);

  Mockle = dep({});

  if (typeof exports === "object" && exports) {
    module.exports = Mockle;
  }

  Mockle.module = function(name, deps, def) {
    Mockle.define(name, deps, function() {
      function init() { };
      init.prototype = def;

      def.create = function() {
        var obj = new init;
        if (obj.initialize) obj.initialize.apply(obj, arguments);
        return obj;
      };

      Mockle[name] = def;
    });

    if (def.setup) {
      Mockle.use(name, function() { def.setup() });
    }
  };
}).call(this);

