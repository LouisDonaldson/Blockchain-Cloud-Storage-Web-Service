const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("fs").promises;

let db;
module.exports = class Database_Handler {
  constructor(offline_dev = false) {
    // this.GetTempConfigJSON();
    this.offline_dev = offline_dev;

    console.log("Database handler created.");
    (async () => {
      // open the database
      db = await open({
        filename: `./company/database/company-database.db`,
        driver: sqlite3.Database,
      });
      console.log("Database connected...");
      try {
        // drops table then creates new one
        try {
          await db.exec(` 
        DROP TABLE users;`);
        } catch { }

        await db.exec(` 
      CREATE TABLE "users" (
      "ID"	INTEGER UNIQUE,
      "Username"	varchar(50) NOT NULL UNIQUE,
      "Password"	varchar(50) NOT NULL,
      PRIMARY KEY("ID" AUTOINCREMENT)
        );`);

        const config_data = await this.GetConfigFile()
        config_data

        // Add dummy data here
        await db.exec(`
        INSERT INTO users (Username, Password)
        VALUES ("${config_data.admin_login.username}", "${config_data.admin_login.password}");`);
        // console.log(response);
      } catch (err) {
        console.error(err);
      }

      // await db.exec('INSERT INTO tbl VALUES ("test")')
    })();
  }
  async GetConfigFile() {
    const contents = await fs.readFile("company/configFile.json");
    const json = contents.toString();
    return JSON.parse(json);
  }

  async CheckLogInDetails(username, password) {
    const sql_string =
      `SELECT * FROM users WHERE users.Username = "${username}" AND users.Password = "${password}";`;
    try {
      const rows = await db.all(sql_string);

      if (rows.length == 1) {
        if (rows[0].Username == username && rows[0].Password == password) {
          return true;
        }
      }
      else if (rows.length > 1) {
        throw new Error("Error: Multiple users with provided log in details exist.")

      }
    }
    catch (err) {
      console.error(err)
    }
    return false;
  }
};
