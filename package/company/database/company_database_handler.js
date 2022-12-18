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
  constructor(GetHash, offline_dev = false, config_data) {
    this.config_data = config_data
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
    };

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
      } catch (err) {
        err;
      }
    };

    const CreateFilesTable = async () => {
      try {
        await db.exec(` 
        DROP TABLE files;`);
      } catch { }

      try {
        await db.exec(` 
      CREATE TABLE "files" (
        "file_ID"	INTEGER UNIQUE,
        "fileName" TEXT,
      "userID"	INTEGER,
      "file_data"	BLOB NOT NULL,
      "description" TEXT,
      
      PRIMARY KEY("file_ID" AUTOINCREMENT));`);
      } catch (err) {
        err;
      }
    };
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
        await CreateFilesTable();

        const config_data = this.config_data

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
    const sql_string = `SELECT * FROM users WHERE Username = "${username}";`;
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
    const sql_string = `SELECT * FROM users WHERE users.Username = "${username}"`;
    const rows = await db.all(sql_string);

    if (rows.length > 1) {
      throw new Error(
        "Error: Multiple users with provided log in details exist."
      );
    }

    return rows[0].ID;
  }
  async AddSessionToken(user_id, session_token) {
    const sql_string = `INSERT INTO session_tokens (UserID, Session_token)
      VALUES (${user_id}, "${session_token}");`;
    try {
      await db.exec(sql_string);
    } catch (err) {
      if (
        err.message.includes("SQLITE_CONSTRAINT: UNIQUE constraint failed:")
      ) {
        const new_sql_string = `UPDATE session_tokens
SET Session_token = '${session_token}'
WHERE userID = ${user_id};`;
        await db.exec(new_sql_string);
      }
    }
  }
  async CheckToken(token_string) {
    const sql_string = `SELECT * FROM Session_tokens WHERE Session_token = "${token_string}"`;
    const rows = await db.all(sql_string);

    if (rows.length > 1) {
      throw new Error(
        "Error: Multiple users with provided log in details exist."
      );
    }

    if (rows.length == 0) {
      return false;
    } else {
      if (token_string == rows[0].Session_token) {
        return true;
      } else {
        throw new Error("Something went wrong when reading session tokens");
      }
    }
  }
  async GetUserIDFromToken(token_string) {
    const sql_string = `SELECT * FROM Session_tokens WHERE Session_token = "${token_string}"`;
    const rows = await db.all(sql_string);

    if (rows.length > 1) {
      throw new Error("Error: Multiple users with same session token.");
    }

    if (rows.length == 0) {
      return false;
    } else {
      if (token_string == rows[0].Session_token) {
        const user_data = await this.GetUserDataFromID(rows[0].userID);
        return await user_data.ID;
      } else {
        throw new Error("Something went wrong when reading session tokens");
      }
    }
  }
  async GetUserDataFromID(id) {
    const sql_string = `SELECT * FROM users WHERE users.ID = ${id}`;
    const rows = await db.all(sql_string);
    if (rows[0].ID == id) {
      return rows[0];
    } else {
      throw new Error("Incorrect user data pulled from DB");
    }
  }
  async UploadFile(upload_data) {
    // const file_json = JSON.stringify(upload_data.binary_data)
    const file_buffer = Buffer.from(JSON.stringify(upload_data.binary_data));
    const binary_string = file_buffer.toString();
    const sql_string = `INSERT INTO files (UserID, fileName, file_data, description)
      VALUES (${upload_data.userID}, "${upload_data.fileName}", '${binary_string}', "${upload_data.description}");`;
    try {
      await db.exec(sql_string);
      return true;
    } catch (err) {
      err;
      return false;
    }
  }
  async GetFileMeta() {
    const sql_string = `SELECT fileName, description FROM files`;
    const rows = await db.all(sql_string);
    return rows;
  }
};
