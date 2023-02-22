const { Worker, isMainThread, parentPort } = require("node:worker_threads");

module.exports = class WorkerHandler {
  constructor(threads_num = 5) {
    this.worker_pool = new ThreadPool(threads_num);
    const Sleep = (timeout = 1000) => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
      });
    };

  }
  ActivateWorker = (message) => {
    const thread = this.worker_pool.GetWorker();

    thread.on("message", (msg) => {
      if (msg.message == "Error") {
        console.log(`An error occurred: ${msg}`);
        this.ActivateWorker(message)
      }
    });
    if (message) {
      thread.postMessage(message)
    }
    else {
      throw new Error("Thread message not present...")
    }

    return thread;
  };
};

class ThreadPool {
  constructor(number_of_initial_threads) {
    this.num_initial_threads = number_of_initial_threads;
    this.threads = [];
    (async () => {
      for (let i = 0; i != this.num_initial_threads; i++) {
        this.CreateNewWorker();
        await Sleep();
      }
      setInterval(() => {
        if (this.threads.length < this.num_initial_threads) {
          for (let i = this.threads.length; i < this.num_initial_threads; i++) {
            this.CreateNewWorker();
          }
        }
      }, 500)
    })();
  }
  CreateNewWorker = (force = false) => {
    if (force) {
      this.threads.push({
        in_use: false,
        worker: new Worker(__dirname + "/worker.js"),
      });
    } else {
      if (this.threads.length < this.num_initial_threads) {
        this.CreateNewWorker(true);
      }
    }
  };
  GetWorker = () => {
    const thread_found = false;
    while (!thread_found) {
      const thread = this.threads.pop();
      if (thread) {
        if (thread.in_use == false) {
          this.CreateNewWorker();
          return thread.worker;
        }
      } else {
        this.CreateNewWorker();
      }
    }
  };
}

const Sleep = async (timeout = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout)
  })
}
