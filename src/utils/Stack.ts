export class Stack<T> implements Iterable<T> {
  storage: T[] = [];

  constructor(...items: T[]) {
    items.forEach(item => this.push(item));
  }

  push(item: T): void {
    this.storage.push(item);
  }

  pop(): T | undefined {
    return this.storage.pop();
  }

  peek(): T | undefined {
    return this.storage[this.size - 1];
  }

  get(i: number): T | undefined {
    return this.storage[i];
  }

  get size(): number {
    return this.storage.length;
  }

  [Symbol.iterator](): Iterator<T> {
    let index = this.size;
    const data = this.storage;

    return {
      next: () => ({
        value: data[--index],
        done: index < 0,
      }),
    };
  }
}
