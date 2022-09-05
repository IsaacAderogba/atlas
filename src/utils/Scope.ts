import { AtlasValue } from "../interpreter/AtlasValue";

export class Scope<T> {
  private storage = new Map<string, T>();

  static fromGlobals<T>(
    obj: { [name: string]: AtlasValue },
    set: (name: string, value: AtlasValue) => T
  ): Scope<T> {
    const scope = new Scope<T>();

    for (const [name, value] of Object.entries(obj)) {
      scope.storage.set(name, set(name, value));
    }

    return scope;
  }

  has(key: string): boolean {
    return this.storage.has(key);
  }

  get(key: string): T | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: T): void {
    this.storage.set(key, value);
  }

  values(): IterableIterator<T> {
    return this.storage.values();
  }
}
