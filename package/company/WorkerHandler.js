const { Worker, isMainThread, parentPort } = require("node:worker_threads");

module.exports = class WorkerHandler {
  constructor(threads_num = 5) {
    this.worker_pool = new ThreadPool(threads_num);
    const Sleep = (timeout = 1000) => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
      });
    };
    (async () => {
      for (let i = 0; i < threads_num; i++) {
        this.worker_pool.CreateNewWorker();
        await Sleep();
      }
    })();
  }
  ActivateWorker = () => {
    const thread = this.worker_pool.GetWorker();

    thread.on("error", (msg) => {
      console.log(`An error occurred: ${msg}`);
    });
    return thread;
  };
};

class ThreadPool {
  constructor(number_of_initial_threads) {
    this.num_initial_threads = number_of_initial_threads;
    this.threads = [];
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
