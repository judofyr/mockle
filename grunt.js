module.exports = function(grunt) {
  grunt.initConfig({
    jison: {
      parser: {
        before: 'Mockle.define("Parser", [], function() {',
        after: 'Mockle.Parser = parser });',
        grammar: 'lib/mockle/grammar.jison',
        dest: 'lib/mockle/parser.js'
      }
    },

    concat: {
      base: {
        src: ["lib/mockle.js", "lib/mockle/parser.js", "lib/mockle/scope.js", "lib/mockle/source.js", "lib/mockle/template.js", "lib/mockle/template_directory.js", "lib/mockle/mockie.js", "lib/mockle/json.js"],
        dest: "mockle.js"
      },

      browser: {
        src: ["mockle.js", "lib/mockle/browser.js"],
        dest: "mockle.browser.js"
      }
    }
  });

  grunt.registerTask('default', 'jison concat');

  grunt.registerMultiTask('jison', 'Parser generator by Jison', function() {
    var fs = require('fs')
      , jison = require('jison');

    var settings = {
      moduleType: 'js',
      moduleName: this.data.name || 'parser',
    };
    var src = fs.readFileSync(this.data.grammar, 'utf8');
    var generator = new jison.Generator(src, settings);
    var res = generator.generate();
    res = res.replace(
      /(var (\w+) = (.*).split\(\/.*\n)/g,
      '$1 if (!$2.length) $2 = ["",""];\n'
    );

    if (this.data.before) {
      res = grunt.template.process(this.data.before) + res;
    }

    if (this.data.after) {
      res = res + grunt.template.process(this.data.after);
    }

    fs.writeFileSync(this.data.dest, res);
  });
};

