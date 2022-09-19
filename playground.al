type GenericType[T] = T

interface Foo[T] {
  foo: GenericType[T]
}

interface Bar[T] {
  bar: GenericType[T]
}

type FooBar[K] = Foo[Bar[K]]


var foo: FooBar[Number] = {
  "foo": {
    "bar": 0
  }
}

print(foo.foo.bar)

interface Array[T] {
  push: (T) -> T
}

class NumberArray implements Array[Number] {
  push: (Number) -> Number = f(num) {
    return num
  }
}
