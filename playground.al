type GenericType[T] = T

interface Foo[T] {
  foo: GenericType[T]
}

interface Bar[T] {
  bar: GenericType[T]
}

type FooBar[T, K] = Foo[T] & Bar[K]


var foo: FooBar[Number, Number] = {
  "foo": 0,
  "bar": 1
}