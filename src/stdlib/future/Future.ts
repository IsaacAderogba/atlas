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

export class Future<T> {
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

  call = (): Future<T> => {
    this.runCallbacks();
    scheduler.run();
    return this;
  };

  then = (valueCb: CallbackResolver<T>): Future<T> => {
    this.valueCbs.push(value => valueCb(value));
    return this.call();
  };

  catch = (errorCb: CallbackRejector): Future<T> => {
    this.errorCbs.push(value => errorCb(value));
    return this.call();
  };

  abort = (message: string): Future<T> => {
    this.errorCbs.push(() => {
      throw new Error(message);
    });
    return this.call();
  };

  finally = (callback: () => void): Future<T> => {
    this.valueCbs.push(() => callback());
    this.errorCbs.push(() => callback());
    return this.call();
  };
}

export const all = <T>(futures: Future<T>[]): Future<T[]> => {
  const results: T[] = [];
  let completedFutures = 0;

  return new Future<T[]>((resolve, reject) => {
    for (let i = 0; i < futures.length; i++) {
      const future = futures[i];
      future
        .then(value => {
          completedFutures++;
          results[i] = value;
          if (completedFutures === futures.length) {
            resolve(results);
          }
        })
        .catch(reject);
    }
  });
};

export const race = <T>(futures: Future<T>[]): Future<T> => {
  return new Future<T>((resolve, reject) => {
    futures.forEach(future => {
      future.then(resolve).catch(reject);
    });
  });
};

const countDown = (count: number): Future<number> => {
  return new Future(rootResolve => {
    const decrement = (count: number): void => {
      new Future<number>(resolve => {
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

// const resolveFuture = new Future<number>(resolve => {
//   return resolve(1);
// });

// const rejectFuture = new Future<number>((_, reject) => {
//   return reject(new Error("err"));
// });

// resolveFuture
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
