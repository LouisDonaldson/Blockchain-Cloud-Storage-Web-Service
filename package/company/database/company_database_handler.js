const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("fs").promises;

module.exports = class Database_Handler {
  constructor(offline_dev = false) {
    // this.GetTempConfigJSON();
    this.offline_dev = offline_dev;

    console.log("Database handler created.");
    (async () => {
      // open the database
      const db = await open({
        filename: `./company/database/company-database.db`,
        driver: sqlite3.Database,
      });
      console.log("Database connected...");
      try {
        // drops table then creates new one
        try {
          await db.exec(` 
      DROP TABLE users;`);
        } catch {}

        await db.exec(` 
      CREATE TABLE users (
      ID int AUTO_INCREMENT,
      Username varchar(50) NOT NULL,
      Password varchar(50) NOT NULL);`);

        // Add dummy data here
        await db.exec(`
        INSERT INTO users (Username, Password)
        VALUES ("louisd", "password");`);

        const response = await db.exec(`
        SELECT * FROM users;`);
        console.log(response);
      } catch (err) {
        console.error(err);
      }

      // await db.exec('INSERT INTO tbl VALUES ("test")')
    })();
  }
  async GetConfigFile() {
    // return this.config_file != undefined ? this.config_file : {
    //   name: "Dyl & Don Design Ltd",
    //   // logo: await fs.readFile("../package/dylndon.png"),
    //   admin_login: {
    //     username: "admin",
    //     password: "admin"
    //   }
    // };
    const contents = await fs.readFile("company/configFile.json");
    const json = contents.toString();
    return JSON.parse(json);
  }
  async GetTempConfigJSON() {
    return JSON.stringify(await this.GetConfigFile());
  }
};
