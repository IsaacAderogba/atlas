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

type GenericFunc[T] = (T) -> T

var func: GenericFunc[Number] = f(gen) {
  return 6
}