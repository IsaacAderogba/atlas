class Foo {
  bar = "" // inferred

  init: (String) -> this = f(name) {
    this.bar = name // explicit
    this.create(this.bar)
  }

  create: (String) -> Null = f(name) {
    print("created " # name)
  }

  foo: (String) -> this = f(foo) {
    return this
  }
}