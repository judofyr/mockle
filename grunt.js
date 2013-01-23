module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      browser: {
        src: ["lib/mockle.js", "lib/mockle/template.js", "lib/mockle/browser.js", "lib/mockle/mockie.js"],
        dest: "mockle.browser.js"
      }
    }
  });
};

