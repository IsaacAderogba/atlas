class Foo[K is String] {
  bar: [T is Number](T) -> Number = f(num) {
    return num * num
  }
}

var foo = Foo[String]()

print(foo.bar[Number](6))