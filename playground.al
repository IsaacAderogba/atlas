var fib = fun(n) {
  if (n <= 1) return n;
  return fib(n - 2) + fib(n - 1);
};

var i = 0;
while (i < 20; i = i + 1) {
  print(fib(i));
}