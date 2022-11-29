const crpyto_js = require("crypto-js");
const Crypto = require("crypto");

let transactions = [];
let proof_of_work_string = "000000";
const proof_of_work_num = proof_of_work_string.length;

class Handler {
  async GenerateHash(json_obj = "") {
    const salt = crpyto_js
      .SHA256(Crypto.randomBytes(20).toString("hex"))
      .toString();
    const string = json_obj + "," + salt;
    const token = crpyto_js.SHA256(string);
    const token_string = token.toString();
    return { token: token_string, salt: salt };
  }
  GenerateRandomHash() {
    const token = crpyto_js.SHA256();
    const token_string = token.toString();
    return token_string;
  }
  async GenerateValidHash() {
    // block contains:
    // main hash
    // hash of transactions
    // hash of previous block
    // timestamp of block creation
    // transactions

    const block_data = {
      test: "this is a test",
      hash: "dfgd8fgadf9gs8dgsdfgsdf7s8df8",
      timestamp: new Date().toISOString(),
    };
    let hash;
    const initial = new Date();
    do {
      hash = await this.GenerateHash(Object.entries(block_data).toString());
      //   console.log(hash.token);
    } while (hash.token.slice(0, proof_of_work_num) != proof_of_work_string);
    const completed = new Date();
    const difference = completed - initial;
    console.log(
      `Generation of block hash took: ${Math.abs(
        (completed - initial) / 1000
      )} seconds.`
    );

    console.log(hash);
    const string = Object.entries(block_data).toString() + "," + hash.salt;

    const token = crpyto_js.SHA256(string);
    const token_string = token.toString();
    console.log(token_string == hash.token);
  }
}

module.exports = new Handler();
