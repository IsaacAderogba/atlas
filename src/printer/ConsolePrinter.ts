import { Printer } from "./Printer";

export class ConsolePrinter implements Printer {
  print(message: string): void {
    console.log(message);
  }

  printError(message: string): void {
    console.error(message);
  }
}
