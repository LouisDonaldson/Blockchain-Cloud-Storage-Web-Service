const encryption_handler = require("./blockchain_encrpytion_handler");
const Transaction = require("./transaction");
const Blockchain = require("./blockchain");
const Block = require("./block");

// const { MessageChannel } = require("node:worker_threads");
// const { port1, port2 } = new MessageChannel();
const http = require("http");
const axios = require("axios");
const fs = require("fs").promises;

// encryption_handler.GenerateValidHash();

class Miner {
  constructor(company_ID) {
    this.company_ID = company_ID;
    this.public_blockchain = [];
    this.api_handler = new ApiHandler();
    this.transactions = [];
    this.GetTransactions();
  }

  async GetTransactions() {}

  HandleNewFile(hash_of_data, timestamp) {}
}

class ApiHandler {
  constructor() {}
  async ShareNewTransactions() {}
  async ConnectToCompany() {}
}

(async () => {
  // const miner = new Miner();
  // port1.on("message", (message) => {
  //   console.log(message);
  // });

  // const config_data = await fs.readFile(/* config file data here */);
  const config_data = {};
})();
