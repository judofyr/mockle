Mockle.include('MinFaker.js');

Mockle.config(function(m) {
  m.merge({
    name: Faker.Name.findName(),
    title: null
  });
});
