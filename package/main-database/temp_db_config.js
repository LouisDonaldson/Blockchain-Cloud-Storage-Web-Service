const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const fs = require("fs").promises
const crpyto_js = require("crypto-js");

module.exports = {
    SetupDatabase: async (db) => {
        try {
            await db.exec(` 
      DROP TABLE "companies";`);

            await db.exec(` 
      CREATE TABLE "companies" (
        "companyID" INTEGER UNIQUE,
        "companyName" TEXT,
      "configFile"	BLOB,
      "uniquePassword" TEXT,
      
      PRIMARY KEY("companyID" AUTOINCREMENT));`);
        } catch (err) {
            err;
        }
    },
    CreateCompany: async (db, company_name, config_file_path, password) => {
        const password_hash = await GetHash(password)
        let config_data;
        try {
            const file = await fs.readFile(`${__dirname}/${config_file_path}`)
            config_data = file.toString()
        }
        catch (err) {
            throw new Error("Error when reading configuration file.")
        }
        if (config_data) {
            const sql_string = `
            INSERT INTO companies (companyName, configFile, uniquePassword)
            VALUES ("${company_name}", '${config_data}', "${password_hash.toString()}");`
            try {
                await db.exec(sql_string)
            }
            catch (err) {
                err
            }
        }
    }
}

async function GetHash(object) {
    const hash = await crpyto_js.SHA256(JSON.stringify(object));
    return hash;
}