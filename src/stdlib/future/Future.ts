import { Scheduler } from "../../runtime/Scheduler";

const scheduler = new Scheduler();

type CallbackResolver<T> = (value: T) => void;
type CallbackRejector = (error: Error) => void;

type Callback<T> = (
  resolve: CallbackResolver<T>,
  reject: CallbackRejector
) => void;

const FULFILLED = "fulfilled";
const REJECTED = "rejected";
const PENDING = "pending";

export class Promise<T> {
  valueCbs: CallbackResolver<T>[] = [];
  errorCbs: CallbackRejector[] = [];
  state: string = PENDING;

  value!: T;
  error!: Error;

  constructor(callback: Callback<T>) {
    scheduler.queueTask(() => callback(this.onSuccess, this.onFail));
  }

  runCallbacks = (): void => {
    if (this.state === FULFILLED) {
      this.valueCbs.forEach(callback => callback(this.value));
      this.valueCbs = [];
    } else if (this.state === REJECTED) {
      this.errorCbs.forEach(callback => callback(this.error));
      this.errorCbs = [];
    }
  };

  onSuccess: CallbackResolver<T> = value => {
    if (this.state !== PENDING) return;

    this.value = value;
    this.state = FULFILLED;
    this.runCallbacks();
  };

  onFail: CallbackRejector = error => {
    if (this.state !== PENDING) return;

    this.error = error;
    this.state = REJECTED;
    this.runCallbacks();
  };

  call = (): Promise<T> => {
    this.runCallbacks();
    scheduler.run();
    return this;
  };

  then = (valueCb: CallbackResolver<T>): Promise<T> => {
    this.valueCbs.push(value => valueCb(value));
    return this.call();
  };

  catch = (errorCb: CallbackRejector): Promise<T> => {
    this.errorCbs.push(value => errorCb(value));
    return this.call();
  };

  abort = (message: string): Promise<T> => {
    this.errorCbs.push(() => {
      throw new Error(message);
    });
    return this.call();
  };

  finally = (callback: () => void): Promise<T> => {
    this.valueCbs.push(() => callback());
    this.errorCbs.push(() => callback());
    return this.call();
  };
}

export const all = <T>(promises: Promise<T>[]): Promise<T[]> => {
  const results: T[] = [];
  let completedPromises = 0;

  return new Promise<T[]>((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      const promise = promises[i];
      promise
        .then(value => {
          completedPromises++;
          results[i] = value;
          if (completedPromises === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    }
  });
};

export const race = <T>(promises: Promise<T>[]): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    promises.forEach(promise => {
      promise.then(resolve).catch(reject);
    });
  });
};

const countDown = (count: number): Promise<number> => {
  return new Promise(rootResolve => {
    const decrement = (count: number): void => {
      new Promise<number>(resolve => {
        if (count <= 0) return rootResolve(count);
        console.log(count);
        resolve(count - 1);
      }).then(decrement);
    };

    decrement(count);
  });
};

all([countDown(5), countDown(5)])
  .then(value => console.log("result", value))
  .catch(error => console.log("error", error));

// const resolvePromise = new Promise<number>(resolve => {
//   return resolve(1);
// });

// const rejectPromise = new Promise<number>((_, reject) => {
//   return reject(new Error("err"));
// });

// resolvePromise
//   .then(value => {
//     console.log("call", value);
//     return value;
//   })
//   .catch(value => {
//     console.log("catch", value);
//     return `${value}`;
//   })
//   .abort("Expected file")
//   .finally(() => {
//     console.log("finally");
//   });
