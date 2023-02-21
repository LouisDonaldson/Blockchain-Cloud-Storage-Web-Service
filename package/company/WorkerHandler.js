const { Worker, isMainThread, parentPort } = require("node:worker_threads");

module.exports = class WorkerHandler {
  constructor(threads_num = 5) {
    this.worker_pool = new ThreadPool();
    const Sleep = () => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 1000);
      });
    };
    (async () => {
      for (let i = 0; i < threads_num; i++) {
        this.worker_pool.CreateNewWorkers();
        await Sleep();
      }
    })();
  }
};

class ThreadPool {
  constructor() {
    this.threads = [];
  }
  CreateNewWorkers = () => {
    this.threads.push({
      in_use: false,
      worker: new Worker(__dirname + "/worker.js"),
    });
  };
}
