const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const temp_db_config = require("./temp_db_config")

module.exports = class Database_Handler {
  constructor(offline_dev = false) {
    this.offline_dev = offline_dev;
    console.log("Database handler created.");
    (async () => {
      // open the database
      const db = await open({
        filename: './main-database/database.db',
        driver: sqlite3.Database
      })

      // temp db set up
      temp_db_config.SetupDatabase(db)
      temp_db_config.CreateCompany(db,
        "Dyl & Don Design Ltd",
        "./config_files/configFile.json",
        "password")
    })()
  }
};



