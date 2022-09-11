class PriorityNode<T> {
  next?: PriorityNode<T>;

  constructor(public value: T, public priority: number) {
    this.value = value;
    this.priority = priority;
  }
}

export class PriorityQueue<T> {
  private head?: PriorityNode<T>;
  private tail?: PriorityNode<T>;
  size = 0;

  enqueue(value: T, priority: number): PriorityNode<T> {
    const node = new PriorityNode(value, priority);

    if (!this.head) {
      this.head = this.tail = node;
    } else if (this.tail) {
      let previous = this.head;
      if (previous.priority >= priority) {
        node.next = previous;
        this.head = node;
        return node;
      }
      let next = previous?.next;
      while (previous && next) {
        if (next.priority >= priority) {
          node.next = next;
          previous.next = node;
          return node;
        }
        previous = previous.next!;
        next = next.next;
      }

      this.tail.next = node;
      this.tail = node;
    }

    this.size++;
    return node;
  }

  dequeue(): PriorityNode<T> | undefined {
    if (!this.head) return;

    const oldHead = this.head;
    this.head = oldHead.next;

    this.size--;
    return oldHead;
  }

  isEmpty(): boolean {
    return !this.head;
  }
}
