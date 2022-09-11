class Node<T> {
  constructor(public value: T, public next?: Node<T>) {
    this.value = value;
  }
}

export class Queue<T> {
  head?: Node<T>;
  tail?: Node<T>;
  size = 0;

  enqueue(value: T): T {
    const newNode = new Node(value);

    if (!this.size) {
      this.head = newNode;
      this.tail = this.head;
    } else if (this.tail) {
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.size++;
    return value;
  }

  dequeue(): T | undefined {
    if (!this.size) return;

    const nodeToRemove = this.head;
    if (nodeToRemove) {
      this.head = nodeToRemove.next;
      nodeToRemove.next = undefined;
    }

    if (!--this.size) {
      this.head = undefined;
      this.tail = undefined;
    }

    return nodeToRemove?.value;
  }

  isEmpty(): boolean {
    return !this.head;
  }
}

const queue = new Queue<number>();

queue.enqueue(1);
queue.enqueue(2);
queue.dequeue();
queue.dequeue();
queue.dequeue();
