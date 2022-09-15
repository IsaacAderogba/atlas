var countDown: (Number) -> Number = f(num) {
  if (num == 0) return 0
  print(num)
  return countDown(num - 1)
}

countDown(5)