const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

module.exports = class Database_Handler {
  constructor(offline_dev = false) {
    this.offline_dev = offline_dev;
    console.log("Database handler created.");
    (async () => {
      // open the database
      const db = await open({
        filename: `./company/database/company-database.db`,
        driver: sqlite3.Database
      })
      console.log("Database connected...")
      // await db.exec('CREATE TABLE tbl (col TEXT)')
      // await db.exec('INSERT INTO tbl VALUES ("test")')
    })()
  }
};
