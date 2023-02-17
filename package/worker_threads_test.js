const { Worker } = require("node:worker_threads");

for (let i = 0; i < 3; i++) {
  const worker = new Worker(__dirname + "/worker_thread_test_worker.js");
}
