const { Worker, isMainThread, parentPort } = require("node:worker_threads");

module.exports = class WorkerHandler {
  constructor(threads_num = 5) {
    this.worker_pool = new ThreadPool(threads_num);

  }
  ActivateWorker = (message) => {
    var thread = this.worker_pool.GetWorker();

    thread.worker.once("message", (msg) => {
      if (msg.message == "Error") {
        console.log(`An error occurred: ${msg}`);
        this.ActivateWorker(message);
      } else {
        if (msg.message == "Successful") {
          thread.in_use = false;
        }
      }
    });

    if (message) {
      thread.worker.postMessage(message);
    } else {
      throw new Error("Thread message not present...");
    }
    return thread.worker;
  };
};

class ThreadPool {
  constructor(number_of_initial_threads) {
    this.num_initial_threads = number_of_initial_threads;
    this.threads = [];
    this.in_use_threads = [];
    this.id = 0;
    (async () => {
      for (let i = 0; i != this.num_initial_threads; i++) {
        this.CreateNewWorker();
        await Sleep(0);
      }
      // setInterval(() => {
      //   if (this.threads.length < this.num_initial_threads) {
      //     for (let i = this.threads.length; i < this.num_initial_threads; i++) {
      //       this.CreateNewWorker();
      //     }
      //   }
      // }, 500);
    })();
  }
  CreateNewWorker = (force = false) => {
    if (force) {
      this.threads.push({
        id: ++this.id,
        in_use: false,
        worker: new Worker(__dirname + "/worker.js"),
      });
    } else {
      if (this.threads.length < this.num_initial_threads) {
        this.CreateNewWorker(true);
      }
    }
  };
  // instead of removing thread from pool then creating a new one, just resuse one once finished executing
  GetWorker = () => {
    const thread_found = false;
    while (!thread_found) {
      for (const thread of this.threads) {
        if (thread.in_use == false) {
          thread.in_use = true;
          return thread;
        }
      }
    }
  };
}

const Sleep = async (timeout = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  });
};
