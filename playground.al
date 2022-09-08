class Small {

}

class Big {
  static small = Small
  hi = "found"

  init = f(hook) {
    this.hook = hook
  }

  exec = f() {
    this.hook()
    print("executed")
  }
}

var big = Big(f() {
  print("pre-hook")
})

big.exec()

Big.exec = f() {
  print("exec statically")
}

Big.exec()

Big.small.exec = f() {
  print("exec small")
}
Big.small.exec()