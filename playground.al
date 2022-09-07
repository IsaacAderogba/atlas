class Foo {
  bar = "bar";
  init = f() {
    this.bar = this.bar # "bar";
  }
}

var x = Foo().bar;