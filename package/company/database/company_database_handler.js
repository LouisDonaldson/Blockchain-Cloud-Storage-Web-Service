const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

module.exports = class Database_Handler {
  constructor(offline_dev = false) {
    this.offline_dev = offline_dev;
    console.log("Database handler created.");
    (() => {
      // open the database
      const db = open({
        filename: './database.db',
        driver: sqlite3.Database
      }).then(() => {
        console.log("Database connected...")
      })
    })()
  }
};
