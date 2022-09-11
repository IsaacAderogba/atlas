import { PriorityQueue } from "../utils/PriorityQueue";
import { Queue } from "../utils/Queue";

export type Task = () => void;

export class Scheduler {
  private ready = new Queue<Task>();
  private sleeping = new PriorityQueue<Task>();

  private sleep = (delay: number): Promise<unknown> => {
    return new Promise(resolve => setTimeout(resolve, delay));
  };

  public queueTask = (task: Task, delay?: number): void => {
    if (delay) {
      const deadline = Date.now() + delay;
      this.sleeping.enqueue(task, deadline);
    } else {
      this.ready.enqueue(task);
    }
  };

  async run(): Promise<void> {
    while (!this.ready.isEmpty() || !this.sleeping.isEmpty()) {
      if (this.ready.isEmpty()) {
        const { priority: deadline, value: task } = this.sleeping.dequeue()!;
        const delta = deadline - Date.now();

        if (delta > 0) await this.sleep(delta);
        this.queueTask(task);
      }

      let task = this.ready.dequeue();
      while (task) {
        task();
        task = this.ready.dequeue();
      }
    }
  }
}
