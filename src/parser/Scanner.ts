import { Token } from "../ast/Token";

export class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private lineStart = 0;

  constructor(source: string) {
    this.source = source;
  }
}
