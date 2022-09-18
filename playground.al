interface Foo {
    foo: String
}

interface Bar {
    bar: String
}

type FooBar = Foo & Bar

class FooBarImpl implements FooBar {
    bar = ""
}