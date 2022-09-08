class Person {
  // prop and method are fields
  static prop = "prop"
  static method = f() {
    this.function = f() {
      print("function")
      this.fn = f() {
        print("fn")
      }
    }

    print("method")
  }

  prop = "prop"
  method = f() {
    this.function = f() {
      print("function")
    }

    print("method")
  }
}

print(Person.prop)
Person.method()
Person.function()
Person.fn()

/*
var person = Person()
print(person.prop)
person.method()
person.function()
*/

class Bacon {
  init = f() {

  }

  eat = f() {
    print("Crunch")
  }
}

var bacon = Bacon()

var bacon2 = bacon.init()
print(bacon2)