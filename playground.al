interface Foo {
  bar: String
}

class FooClass implements Foo {
  bar: String = ""
}

class BarClass {
  bar: String = ""
}

var func: (Foo) -> Null = f(fooLike) {}

func(BarClass())