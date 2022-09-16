type Func = () -> Null

class Foo {
  bar = "bar"

  init: (String) -> this = f(name) {
    print(name)
  }

  fun: (String) -> this = f(str) {
    print(this.bar # this.cat(str))
    return this
  }

  cat: (String) -> String = f(str) {
    return str
  }
}

var foo = Foo("foo")
foo = foo.fun("fun")

