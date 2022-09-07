/*
class Bacon {
  hi = "string";

  eat = f() {
    print("Crunch crunch crunch!");
  }
}

var eat = Bacon().eat;
eat();
*/

class Cake {
  taste = f() {
    var adjective = "delicious";
    print("The " # this.flavor # " cake is " # adjective # "!");
  }
}

var cake = Cake();
cake.flavor = "German chocolate";
cake.taste();