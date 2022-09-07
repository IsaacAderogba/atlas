class Emitter {
  subscribe = f(name) {
    print("Subscribed" # name)

    return f() {
      this.unsubscribe(name)
    }
  }

  unsubscribe = f(name) {
    print("Unsubscribed " # name)
  }
}

var emitter = Emitter()

var unsubscribe = emitter.subscribe("Adam")

unsubscribe();