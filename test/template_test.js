Mockle.use(['Template', 'Scope'], function() {
  var T = Mockle.Template;
  var S = Mockle.Scope;
  var scope;

  QUnit.testStart(function() {
    scope = S.create();
  });

  test("parses text", function() {
    var tmpl = T.create('test', 'Hello world!');
    equal(tmpl.name, 'test', 'Name is accessable');
    equal(tmpl.source, 'Hello world!', 'Source is accessable');
    ok(tmpl.ast, 'AST exists');
  });

  test("renders text", function() {
    var tmpl = T.create('test', 'Hello world!');
    var res = tmpl.render(scope);
    equal(res, 'Hello world!');
  });

  test("renders variables", function() {
    var tmpl = T.create('test', 'Hello @name!');
    scope.push({name: 'Mockle'});
    var res = tmpl.render(scope);
    equal(res, 'Hello Mockle!');
  });
});

