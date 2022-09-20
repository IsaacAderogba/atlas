interface Foo {
  bar: String
}

class FooClass implements Foo {
  bar: String = ""
}

class BarClass {
  bar: Number = 0
}

var func: (Foo) -> Null = f(fooLike) {}

func(BarClass())