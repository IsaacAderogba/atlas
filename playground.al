interface Foo {
  bar: () -> Null
  foo: String
}

class FooClass {
  bar: () -> Null = f() {}

  foo = ""
}

var foo: Foo = FooClass()