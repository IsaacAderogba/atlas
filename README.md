# Atlas, a statically-typed programming language

[Atlas](https://github.com/IsaacAderogba/atlas) is a statically-typed programming language that adopts the beat features from TypeScript and Python.

> Atlas, like many of my projects, has been primarily built for my use cases. If you wish to extend the base functionality, you're encouraged to fork the package.

[Atlas, a statically-typed programming language](https://www.isaacaderogba.com/atlas)

## Guides

This collection of guides should make you familiar with the nuances of the language.

#### Syntax

Atlas’s syntax should be familiar to those coming from higher-level languages such as TypeScript or Python. Programs are stored in plain text files that end with a `.ats` file extension. A simple atlas program looks like the following:

```typescript
// assign the count variable
var count: Number = 0
```

count.ats

**Comments**

The start of the program highlights a line comment. Line comments start with `//`, but can equally start with a `/*` and end with a `*/` :

```typescript
// assign the count variable

/*
 * assign the count variable
 */
```

**Keywords**

Directly following the comment, we see usage of the `var` keyword to the declare the `count` identifier. Keywords in Atlas are words that have been reserved by the programming language. Other notable keywords are `class`, `import`, and `return`.

**Identifiers**

We can see that the `var` keyword was used to create to declare the `count` identifier. Identifiers start with a letter and may contain letters, digits, and underscores.

**Annotations**

Type annotations generally sit in-between a colon, `:`, and an equals sign, `=`. In our simple example, we can actually leave out the `Number` type because it is trivially inferred.

```typescript
var count = 0 // implicitly annotated as Number
```

**Objects**

The `0` that is assigned to the `count` variable is an instance of the object `Number`. Like other class-based languages, every value in Atlas extends from an `Object` base class.

That covers the basics of syntax.

#### Primitives

Atlas has four primitives values that all other objects are composed of.

**Booleans**

A boolean represents either a `true` or a `false` value.

Unlike other programming languages, there is no concept of “truthy" in Atlas. Instead, values must be explicitly tested during control flow operations.

```typescript
var bool: Boolean = true

if (bool == true) {
	print("true")
} else {
	print("false")
}
```

**Numbers**

Numbers in Atlas hold numeric values. These values can be negative and can contain floating points.

```typescript
var negative: Number = -5
var positive: Number = 5
var float: Number = 5.00
```

**Strings**

Strings in Atlas are contiguous sequences of characters. String literals are created by wrapping characters in either double quotes, `”`, or single quotes, `’`.

```typescript
var double: String = "double quote string"
var single: String = "single quote string"
```

**Null**

Finally, Atlas has a special `null` value that indicates the absence of a value.

```typescript
var nothing: Null = null
```

#### Functions

Functions in Atlas take an input and return an output. They’re represented using a similar $$f$$ notation that you’d see in math textbooks:

```typescript
var func: () -> Null = f() {
	print("invoked")
}
```

**Annotating functions**

While annotations can be inferred for primitive values of `String` and `Number`, explicit type annotations are required for functions. A `sum` function that takes two numbers and returns a number is annotated as follows:

```typescript
var sum: (Number, Number) -> Number = f(num1, num2) {
	var result = num1 + num2
	return result
}
```

Atlas’s TypeChecker will ensure that the actual signature for the function corresponds to the type signature, requiring `num1`, `num2`, and `result` to be of the number type.

**Function closures**

As you’d expect, functions are closures that can access variables defined outside of their own scope.

```typescript
var count = 0

var incrementCount: () -> Number = f() {
	count = count + 1
	return count
}

print(incrementCount()) // 1
print(incrementCount()) // 2
```

#### Lists

Lists are composite objects that are capable of holding other objects in a sequence. Like many programming languages, lists can be created using square-bracket notation.

```typescript
var numberList: List[Number] = [1, 2, 3]
```

**Accessing elements**

Because lists are complex objects, we primarily interact with them using method calls. To access an element on a list, for example, we use the `at` method which accepts an integer location.

```typescript
var numberList: List[Number] = [1, 2, 3]

print(numberList.at(0)) // 1
```

**Adding elements**

Adding elements is functionally similar. We use the `add` method which will add an item to the end of the last. Atlas’ type-checker will validate the type of object being added to make sure that it conforms to the list annotation.

```typescript
var numberList: List[Number] = [1, 2, 3]

numberList.add(4)
```

**Removing elements**

The opposite of the `add` operation is `remove`. This removes and returns an element from the end of the list. If there's no element to return, this method returns the `null` object.

```typescript
var numberList: List[Number] = [1, 2, 3]

numberList.remove()
```

#### Records

Like lists, records are composite objects that are capable of holding other objects. Whereas lists are indexed by integer position, records are indexed by key. Records expect `String` keys, but are capable of holding any expression. They're created using the curly-bracket notation, with each entry separated by a comma.

```typescript
var numberRecord: Record[Number] = {
  "1": 1,
  "2": 2
}
```

**Accessing elements**

To access an element on a record, we invoke the `at` method and pass the name of the key that we want to look up.

```typescript
var numberRecord: Record[Number] = {
  "1": 1,
  "2": 2
}

numberRecord.at("1") // 1
```

**Adding elements**

Adding elements is functionally similar. We use the `add` method with the key-value pair that we want to add. Atlas’ type-checker will validate the type of object being added to make sure that it conforms to the record annotation.

```typescript
var numberRecord: Record[Number] = {
  "1": 1,
  "2": 2
}

numberRecord.add("3", 3)
```

**Removing elements**

The opposite of the `add` operation is `remove`. This removes and returns an element with the specified key. If there's no element to return, this method returns the `null` object.

```typescript
var numberRecord: Record[Number] = {
  "1": 1,
  "2": 2
}

numberRecord.remove("2")
```

#### Classes

Classes are a central component of how Atlas works. Like many programming languages, Classes help encapsulate behavior and state through the use of class methods and instance fields. and state However, the subtle design decisions made around classes separate Atlas from other programming languages.

**Classes**

Classed are declared using the `class` keyword, with any initialization work completed inside of an `init` method.

```typescript
class Animal {
  name: String

	init: (String) -> Animal = f(name) {
		this.name = name
	}
}
```

The `init` method is a special method that constructs the class. It implicitly returns a value of the instance being returned, annotated as `this`.

To construct a class instance, we simply call the class as if it were a factory function:

```typescript
var dog = Animal("dog")
```

Declaring a class will create both a value which can be used to create class instances, and a type which can be used for type annotations. For example, we can now create a function that only accepts `Animal` instances as a parameter.

```typescript
var getAnimalName: (Animal) -> String = f(animal) {
	return animal.name
}

var dogName = getAnimalName(dog)
```

**Interfaces**

Importantly, Atlas does not support class inheritance, instead requiring users to compose complex behavior through composition. To enable support for inheritance-like behavior, Atlas supports the creation and implementation of interfaces.

```typescript
interface Foo {
  foo: String
}

interface Bar {
  bar: String
}
```

An interface is a specification of the structure that a class should have. Interfaces can be added together using the `&` operator, allowing for behavior similar to multiple inheritance. We can see this in use with our `FooBar` class which is required to satisfy the the `Foo` and `Bar` interfaces.

```typescript
class FooBar implements Foo & Bar {
  foo = "foo"
  bar = "bar"
}
```

Atlas will raise an error for incorrect implementation. For example, specifying that `bar=0` will raise the following error in the console:

```typescript
20    class FooBar implements Foo & Bar {
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected "Bar", but got "FooBar"
                                        expected "String", but got "Number"
```

This alerts us that `Bar` expected a `String`, but `FooBar` provided a `Number`.

#### Types

We’ve introduced the core object types that Atlas deals with. To support creating strongly-typed programs, Atlas also exposes a number of utility types.

**Alias type**

An `Alias` type simply allows us re-alias a type under a different name. This is often useful for code clarity.

```typescript
type Id = Number
```

**Any type**

The `Any` type is a useful escape hatch when we don’t want to deal with type annotations in places where they are required. For instance, we can use `Any` when typing functions to declare that a function will work with any type.

```typescript
var logValue: (Any) -> Any = f(value) {
  print(value)
}
```

You should use `Any` sparingly as it disables the type-checker.

**Union type**

`Union` types are created when we use the pipe, `|`, operator when defining a type. They specify that a type can be one of either type.

```typescript
type Primitive = String | Number | Boolean | Null
```

**Intersection type**

`Intersection` types are created when we the ampersand, `&`, operator when defining a type. They specify that a type must satisfy all subtypes.

```typescript
interface Foo {
  foo: String
}

interface Bar {
  bar: String
}

type FooBar = Foo & Bar
```

**Generic type**

Finally, Atlas supports `Generic` types. Generics can be used for types, interfaces, functions, and classes. We enclose generic parameters using the double-bracket notation:

```typescript
type GenericType[T] = T

interface GenericInterface[T] {
  value: T
}

var genericFunction: [T](T) -> T = f(value) {
  return value
}

class GenericClass[T] {
  value: T
}
```

To support generic inference, we can constrain generics using the `is` keyword. The type-checker will use this constraint for annotation purposes inside of the body of a generic.

```typescript
var genericFunction: [T is Number](T) -> T = f(value) {
  return value * value
}
```

Because we’ve constrained `T` to a number, the type-checker permits use of the multiplication, `*`, operator.

We can even wrap generics to create higher-order utility objects

```typescript
class Map[T] {
	record: Record[T] = { }

	add: (String, T) -> T = f(key, value) {
		return this.record.add(key, value)
	}
}

var stringMap = Map[String]()
stringMap.add("key", "foo")

var numberMap = Map[Number]()
numberMap.add("key", 0)
```

#### Modules

For larger-sized projects, Atlas supports modularizing code into modules. Each file that ends with an `.ats` extension is registered as an Atlas module. Unlike other programming languages, Atlas doesn't require to explicitly export code from modules using an `export` keyword.

Modules can be imported using the `import` keyword.

**Absolute imports**

Importing a module using an absolute path will attempt to find that module in an `atlas_modules` directory. If the module doesn't exist in an `atlas_modules` directory, Atlas will assume that you're trying to import a module from its standard library.

```typescript
import Path from "path" // imports from stdlib

var joined = Path.join("foo", "bar")
```

absolute.ats

**Relative imports**

Importing a module using a relative path will attempt an import relative to the working directory. For example, importing the `absolute.ats` module is as follows:

```typescript
import Absolute from "./absolute"

print(Absolute.joined)
```

relative.ats

#### Errors

Atlas errors come in various forms.

**Syntax errors**

Syntax errors come up when your code doesn’t follow the language’s expected syntax:

```typescript
var foo = + 4 + 4
```

Atlas will detect this error and report a user-friendly message with the relevant line and column position:

```plaintext
playground/index.ats:1:11 | syntax error: expected left operand

1     var foo = + 4 + 4
                ^ a left-hand side operand was expected
```

**Semantic errors**

If the code is syntactically correct, the next error you’re likely to run into is a semantic error. This alerts you to erroneous code that probably won’t work as you expect.

```typescript
this.foo = "bar"
```

```plaintext
playground/index.ats:2:1 | semantic error: prohibited this

2     this.foo = "bar"
      ^^^^ this expression was used outside of the context of a class
```

**Type errors**

The most frequent source of errors will likely be type errors. Atlas’ type-checker builds up a static representation of your code and errors when there are type mismatches.

```typescript
var foo: Number = "bar"
```

```plaintext
playground/index.ats:1:19 | type error: invalid subtype

1     var foo: Number = "bar"
                        ^^^^^ expected "Number", but got "String"
```

**Runtime errors**

Errors that the type-checker couldn’t catch are thrown at runtime. This might happen in situations where you specify a type, but fail to give it an initial value.

```typescript
class Foo {
  func: () -> Null

  init: () -> Foo = f() {
    // this.func = f() {} <- this.func will be null because this code will not run
  }
}

var foo = Foo()
foo.func()
```

```plaintext
playground/index.ats:11:1 | runtime error: expected callable

11    foo.func()
      ^^^^^^^^ a function or class was expected
```

## Standard library

Core libraries that expose functionality for creating sophisticated programs. Will be added to over time.

#### Path

Todo

## Reference

#### Acknowledgements

It’s been a long-time goal of mine to develop a personal programming language. I wouldn’t have been able to do it without these fantastic resources:

[Dmitry Soshnikov Education](http://dmitrysoshnikov.com/)

Dmitry Soshnikov’s collection of programming language courses give a concise overview of different topics. His course on building a type-checker was particularly helpful for understanding the main parts of a type-checker.

[Crafting Interpreters](https://craftinginterpreters.com/)

Crafting Interpreters is a phenomenal resource that walks you step-by-step in building a full-featured scripting language. Following Robert Nystrom’s lessons helped build a strong foundation for the language, even if I did end up re-writing many parts of how the language operates.

[Reconstructing TypeScript, part 0: intro and background](https://jaked.org/blog/2021-09-07-Reconstructing-TypeScript-part-0)

Reconstructing TypeScript goes into detail on various type-checking algorithms and how they’re applied in practice. This was a crucial resource in building the type-checker.

[GitHub - DavidTimms/loxdown: A statically-typed variant of Lox, written in TypeScript](https://github.com/DavidTimms/loxdown)

While not an educational resources, David Timms’ Loxdown is a statically-typed variant of the language created from Crafting Interpreters. Any time I added a new language feature, I would cross-reference it with David’s work to learn how I could have tackled the problem differently. This proved to be incredibly valuable for the TypeChecker.

