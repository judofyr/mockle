var fs = require('fs');
var path = require('path');

var specsDir = path.join(__dirname, 'spec/specs');
var files = ["if", "for"];
var Mockle = require('../mockle');
var N = 0;

Mockle.use(["Template", "Scope"], function() {
  files.forEach(function(file) {
    var full = path.join(specsDir, file + '.json');
    var testCase = JSON.parse(fs.readFileSync(full));
    console.log("# " + file);
    testCase.tests.forEach(runTest);
  });
});


function assert(cond, msg) {
  var id = ++N;
  var str = 'ok ' + id + ' - ' + msg;
  if (!cond) str = 'not ' + str;
  console.log(str);
}

function runTest(test) {
  var tmpl = Mockle.Template.create(test.name, test.template);
  var scope = Mockle.Scope.create();
  scope.push(test.data);

  try {
    tmpl.parse();

    var res = tmpl.render(scope);
    assert(res == test.expected, test.name);
  } catch (err) {
    if (test.error) {
     assert(1, test.name);
     return;
    }

    console.log(err);
    assert(0, test.name);
    return;
  }
}

