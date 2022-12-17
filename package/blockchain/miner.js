const encryption_handler = require("./blockchain_encrpytion_handler");
const Transaction = require("./transaction");
// encryption_handler.GenerateValidHash();

class Miner {
  constructor(company_ID) {
    this.company_ID = company_ID;
    this.public_blockchain = []
    this.api_handler = new ApiHandler();
    this.transactions = []
    GetTransactions()
  }

  async GetTransactions() {

  }

  HandleNewFile(hash_of_data, timestamp) {

  }
}

class ApiHandler {
  constructor() {

  }
  async ShareNewTransactions() {

  }
}

(() => {
  const miner = new Miner();
})();
