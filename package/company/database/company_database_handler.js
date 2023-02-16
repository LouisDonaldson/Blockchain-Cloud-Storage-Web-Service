const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fs = require("fs").promises;

// any changes to the configuration of tables means this needs to be set to true to take affect
const reset_tables = false;

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
      } catch {}

      await db.exec(` 
      CREATE TABLE "users" (
      "ID"	INTEGER UNIQUE,
      "Permission_Level" INTEGER NOT NULL,
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
      } catch {}

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
      } catch {}

      try {
        await db.exec(` 
      CREATE TABLE "files" (
        "file_ID"	INTEGER UNIQUE,
        "fileName" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "userID"	INTEGER NOT NULL,
        "filePath"	TEXT NOT NULL,
        "description" TEXT,
        "timeStamp" TEXT NOT NULL,
      
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
        const config_data = await this.GetConfigFile();

        if (reset_tables) {
          // drops table then creates new one
          await CreateUsersTable();
          await CreateSessionTokensTable();
          await CreateFilesTable();

          // Add dummy data here
          const password_hash = await GetHash(config_data.admin_login.password);
          const hash_string = password_hash.toString();

          // admin has top level permissions
          await db.exec(`
            INSERT INTO users (Username, Password, Name, Permission_Level)
            VALUES ("${config_data.admin_login.username}", "${hash_string}", "${config_data.admin_login.name}", "${config_data.admin_login.Permission_Level}");`);

          await db.exec(`
            INSERT INTO users (Username, Password, Name, Permission_Level)
            VALUES ("admin2", "${hash_string}", "Second Admin", "1");`);

          // temporary account // Permission level 2
          await db.exec(`
            INSERT INTO users (Username, Password, Name, Permission_Level)
            VALUES ("Viewer", "${hash_string}", "Viewer", "3");`);
        }
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

  async GetUserDataFromToken(token_string) {
    const id = await this.GetUserIDFromToken(token_string);

    const sql_string = `SELECT ID, Permission_Level, Name, Username FROM Users WHERE ID = "${id}"`;
    const rows = await db.all(sql_string);

    if (rows.length > 1) {
      throw new Error("Error: Multiple users with same ID.");
    }

    if (rows.length == 0) {
      return false;
    } else {
      return rows[0];
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
  async UploadFile(upload_data, file_path) {
    // const file_json = JSON.stringify(upload_data.binary_data)
    const file_buffer = Buffer.from(JSON.stringify(upload_data.binary_data));
    const binary_string = file_buffer.toString();
    const sql_string = `INSERT INTO files (UserID, fileName, type, size, filePath, description, timestamp)
      VALUES (${upload_data.userID}, "${upload_data.fileName}", "${upload_data.type}", ${upload_data.size}, "${file_path}", "${upload_data.description}", "${upload_data.timestamp}");`;
    try {
      await db.exec(sql_string);

      return true;
    } catch (err) {
      err;
      return false;
    }
  }
  async GetFileMeta() {
    const sql_string = `SELECT file_ID, fileName, type, description, timestamp, UserID FROM files`;
    const rows = await db.all(sql_string);
    for (const i in rows) {
      const row = rows[i];
      const user_data = await this.GetUserDataFromID(row.userID);
      rows[i].uploaded_by = user_data.Name;
    }
    return rows;
  }
  async GetFile(file_id) {
    const sql_string = `SELECT filePath, fileName, type FROM files where file_ID="${file_id}"`;
    const rows = await db.all(sql_string);
    if (rows.length > 1) {
      throw new Error("Multiple files with same file ID present");
    }

    const file_path = rows[0].filePath;
    const file_json = JSON.parse((await fs.readFile(file_path)).toString());
    return {
      fileName: rows[0].fileName,
      file_data: file_json.data,
    };
    // return rows[0];
  }
};
