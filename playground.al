var x = 0;
var y = 0;
for (; x < 5; x = x + 1) {
  print x;
  if (x == 2) continue;        
  y = y + 1;
}