const encryption_handler = require("./blockchain_encrpytion_handler");
const Transaction = require("./transaction");
const Blockchain = require("./blockchain")
const Block = require("./block")

// encryption_handler.GenerateValidHash();

class Miner {
  constructor(company_ID) {
    this.company_ID = company_ID;
    this.public_blockchain = []
    this.api_handler = new ApiHandler();
    this.transactions = []
    this.GetTransactions()
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
  // const miner = new Miner();

  let DonCoin = new Blockchain();

  console.log("Mining block 1...");
  DonCoin.addBlock(new Block(1, "05/02/2022", { amount: 4 }));

  console.log("Mining block 2...");
  DonCoin.addBlock(new Block(2, "05/02/2022", { amount: 10 }));

  console.log(JSON.stringify(DonCoin, null, 4));
})();
