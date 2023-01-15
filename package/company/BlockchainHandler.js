const crpyto_js = require("crypto-js");
const Miner = require("../blockchain/miner.js")
const axios = require("axios")

module.exports = class BlockchainHandler {
  constructor(number_of_miners, machine_address, machine_port) {
    const IntialiseMiners = (number_of_miners = 1, company_miner_password = "") => {
      if (this.miners) {
        throw new Error("ERROR: Miners already intialised and running.")
      }

      for (let index = 0; index < number_of_miners.length; index++) {
        if (!this.miners) {
          this.miners = []
        }

        this.miners.push(new Miner(company_miner_password))
      }
      console.log(this.miners)
    }
    this.machine_port = machine_port
    this.host_machine_addr = machine_address
    const company_miner_password = encryption_handler.GenerateRandomToken();
    encryption_handler.GetHash(company_miner_password).then(hash => {
      this.miner_password_hash = hash.toString()
      console.log("Company miner authentication hash: " + this.miner_password_hash);

      IntialiseMiners(number_of_miners, company_miner_password.toString())
    })
  }

  InitialiseConnection() {
    return new Promise((resolve, reject) => {
      axios(`http://${this.host_machine_addr}:${this.machine_port}/blockchain/init`)
        .then((response) => {
          if (response.status == 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
};

const api_handler = {
  StartHTTP: function () {
    http.createServer((req, res) => {

    }).listen(3001)
  },
  HTTP_Handler: function (req, res) {
    if (req.url.includes("blockchain")) {

    }
    else {
      res.writeHead("502");
      res.end()
    }
  }
}

const encryption_handler = {
  GenerateRandomToken(optional_string = "") {
    const token = crpyto_js.SHA256(
      JSON.stringify({
        date: new Date().toISOString(),
        optional_string: optional_string,
      })
    );
    return token;
  },
  async GetHash(object) {
    const hash = await crpyto_js.SHA256(JSON.stringify(object));
    return hash;
  },
};
