class Emitter {
  init = f() {
    return null
  }

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

unsubscribe()