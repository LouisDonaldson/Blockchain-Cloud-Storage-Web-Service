const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("fs").promises;

/*
to-do: migrate log in checking over to DB. Session tokens should be stored in DB
table cols = username, session_token

everytime /data is called get user data from db including name
*/

let db;
module.exports = class Database_Handler {
  constructor(GetHash, offline_dev = false) {
    this.GetHash = GetHash;
    // this.GetTempConfigJSON();
    this.offline_dev = offline_dev;

    const CreateUsersTable = async () => {
      try {
        await db.exec(` 
        DROP TABLE users;`);
      } catch { }

      await db.exec(` 
      CREATE TABLE "users" (
      "ID"	INTEGER UNIQUE,
      "Username"	varchar(50) NOT NULL UNIQUE,
      "Password"	varchar(50) NOT NULL,
      "Name"	varchar(50) NOT NULL,

      PRIMARY KEY("ID" AUTOINCREMENT)
        );`);
    }

    const CreateSessionTokensTable = async () => {
      try {
        await db.exec(` 
        DROP TABLE session_tokens;`);
      } catch { }

      try {
        await db.exec(` 
      CREATE TABLE "session_tokens" (
      "userID"	INTEGER UNIQUE,
      "Session_token"	varchar(50) NOT NULL UNIQUE);`);
      }
      catch (err) {
        err
      }

    }

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
        await CreateUsersTable();
        await CreateSessionTokensTable();

        const config_data = await this.GetConfigFile();

        // Add dummy data here
        const password_hash = await GetHash(config_data.admin_login.password);
        const hash_string = password_hash.toString();
        await db.exec(`
        INSERT INTO users (Username, Password, Name)
        VALUES ("${config_data.admin_login.username}", "${hash_string}", "${config_data.admin_login.name}");`);
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
    const sql_string = `SELECT * FROM users;`;
    // const sql_string = `SELECT * FROM users
    // WHERE users.Username = "${username}" AND users.Password = "${password}"
    // ;`;
    const hashed_password = await this.GetHash(password);
    const hash_string = hashed_password.toString();
    try {
      const rows = await db.all(sql_string);

      if (rows.length == 1) {
        if (rows[0].Username === username && rows[0].Password === hash_string) {
          return true;
        }
      } else if (rows.length > 1) {
        throw new Error(
          "Error: Multiple users with provided log in details exist."
        );
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  }
  async GetUserData() {
    return "";
  }
  async GetUserId(username) {
    const sql_string = `SELECT * FROM users WHERE users.Username = ${username}`
    const rows = await db.all(sql_string);

    if (rows.length > 1) {
      throw new Error("Error: Multiple users with provided log in details exist.")
    }

    rows
  }
};
