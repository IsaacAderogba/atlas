var count: ((Number) -> Number) -> Null = f(func) {
  print(func(1))
}

count(f(number) {
  return number
})