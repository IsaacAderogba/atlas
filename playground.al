interface Foo {
    foo: String
}

interface Bar {
    bar: String
}

var func: (Foo & Bar) -> Null = f(arg) {

}

func({
    "foo": "foo"
})