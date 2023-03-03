// console.log("Worker spawned");

const { Worker, isMainThread, parentPort } = require("node:worker_threads");

const fs_promises = require("fs").promises;
const fs = require("fs");
const database_handler = require("./database/company_database_handler.js");
const encryption_handler = require("../encryption_handler");

try {
  //#region code
  // Company Server
  /*
  Contains the main business logic of the company. Handles requests to the database,
  deals with client interaction as well as well as routes data to and from the blockchain miner
  
  Sits behind the company gateway server
  */

  // const { Worker } = require("worker_threads");
  /*
  
  const express = require("express");
  const { Worker } = require("worker_threads");
  ...
  app.get("/blocking", async (req, res) => {
    const worker = new Worker("./worker.js");
    worker.on("message", (data) => {
      res.status(200).send(`result is ${data}`);
    });
    worker.on("error", (msg) => {
      res.status(404).send(`An error occurred: ${msg}`);
    });
  });
  
  */

  // const axios = require("axios");

  // const miner = require("../blockchain/miner");
  // const { Worker } = require("node:worker_threads");
  // const miner = new Worker("../blockchain/miner");
  // let blockchain_handler;

  //#region Global variables
  // const port = 3000;
  // const original_ping_interval = 5000;
  // let ping_interval = 5000;
  // let api_data_handler;
  //#endregion

  const api_website_files_handler = {
    CheckValidSessionCookie: async function (cookie_header) {
      const cookies = cookie_header.split(";");
      // parse cookies
      for (const _cookie of cookies) {
        const cookie = _cookie.trim();
        const split_cookie = cookie.split("=", 2);
        if (split_cookie[0] == "session_token") {
          if (await api_data_handler.CheckCookie(split_cookie[1])) {
            return true;
          } else {
            return false;
          }
        }
      }
    },
  };

  parentPort.on("message", (message) => {
    //   parentPort.postMessage(message);
    console.log("Operation received by worker script.");
    switch (message.message) {
      case "File upload":
        api_data_handler.HandleFileUpload(
          message.data.data,
          message.data.cookie
        );
        // setTimeout(() => { }, 5000);
        parentPort.postMessage({
          message: "Successful",
        });
        break;
      case "File download":
        let user_data;
        const GetFileIDFromURL = (url) => {
          if (url.includes("?")) {
            const url_split = url.split("?");
            const split = url_split[1].split("=");
            if (split[0] == "file_id") {
              console.log(
                `Request for File. File ID = ${split[1]} from ${user_data.Name}`
              );
              return split[1];
            }
          }

          return undefined;
        };
        api_data_handler
          .GetUserData({ headers: { cookie: message.data.cookie } })
          .then((_user_data) => {
            if (_user_data) {
              if (_user_data.Permission_Level < 3) {
                user_data = _user_data;
                const file_id = GetFileIDFromURL(message.data.request_url);
                api_data_handler.GetFile(file_id).then((file_data) => {
                  parentPort.postMessage({
                    message: "Successful",
                    data: JSON.stringify(file_data),
                  });
                });
              } else {
                parentPort.postMessage({ message: "Unauthorised User" });
              }
            } else {
              parentPort.postMessage({ message: "Unauthorised User" });
            }
          });

        break;
    }
  });
  try {
    // worker.on("error", (msg) => {
    //   res.status(404).send(`An error occurred: ${msg}`);
    // });

    //#region code

    class CompanyDataHandler {
      constructor() {
        this.db_handler = new database_handler(
          encryption_handler.GetHash,
          encryption_handler.GenerateRandomToken,
          true
        );
        this.session_tokens = [];
        (async () => {
          this.config_file = await this.db_handler.GetConfigFile();
        })();
      }
      // what gets sent back to client every time it makes a request // only on portal page
      async SendCurrentData(req, res) {
        // res.end(JSON.stringify(await db_handler.GetConfigFile()))
        // this.config_file = await this.db_handler.GetConfigFile();
        res.end(
          JSON.stringify({
            user_data: await this.GetUserData(req),
            name: this.config_file.name,
            logo: await fs_promises.readFile(this.config_file.logo_path),
            files: await this.db_handler.GetFileMeta(),
          })
        );
      }

      async SendInitialData(req, res) {
        // res.end(JSON.stringify(await db_handler.GetConfigFile()))
        // this.config_file = await this.db_handler.GetConfigFile();
        res.end(
          JSON.stringify({
            // user_data: await this.GetUserData(req),
            name: this.config_file.name,
            logo: await fs_promises.readFile(this.config_file.logo_path),
            // files: await this.db_handler.GetFileMeta(),
          })
        );
      }

      async GetUserData(req) {
        if (req.headers?.cookie) {
          if (
            api_website_files_handler.CheckValidSessionCookie(
              req.headers?.cookie
            )
          ) {
            let cookie_header = req.headers.cookie.split("=")[1];
            const user_data = await this.db_handler.GetUserDataFromToken(
              cookie_header
            );
            return user_data;
          }
        }
      }

      async CheckAuth(username, password) {
        // check authentication
        //#region Temp
        if (await this.db_handler.CheckLogInDetails(username, password)) {
          const session_token = encryption_handler.GenerateRandomToken();
          const user_id = await this.db_handler.GetUserId(username);
          this.db_handler.AddSessionToken(user_id, session_token);
          // this.session_tokens.push(session_token.toString());
          return {
            auth: true,
            token: session_token,
          };
        } else {
          return {
            auth: false,
          };
        }
        //#endregion
      }

      async GetSessionTokenFromString(cookie_string) {
        const cookies = cookie_string.split(";");
        // parse cookies
        for (const _cookie of cookies) {
          const cookie = _cookie.trim();
          const split_cookie = cookie.split("=", 2);
          if (split_cookie[0] == "session_token") {
            return split_cookie[1];
          }
        }
      }

      async CheckCookie(cookie_string) {
        return await this.db_handler.CheckToken(cookie_string);
      }

      async HandleFileUpload(data_obj_json, token_string, file_name) {
        console.log("Uploading data to database.");
        const data_obj = JSON.parse(JSON.parse(data_obj_json));
        const file_data = JSON.parse(JSON.parse(data_obj.file));
        const dateTime = data_obj.dateTime;

        // data_obj

        // file name = obj.name
        // file data = obj.binaryString
        let file_buffer = file_data.binaryString;
        // console.log(file_buffer);
        const file_data_entries = Object.entries(file_buffer);
        const array = [];

        for (const i in file_data_entries) {
          array[i] = file_data_entries[i][1];
        }

        const fs_buffer = Buffer.from(array);

        this.config_file = await this.db_handler.GetConfigFile();

        // write file to file system
        const fs_name = `${__dirname}/database/${this.config_file.file_path}/${
          (Math.random() * 10000) | 0
        }_${file_data.name}`;

        fs.writeFile(fs_name, fs_buffer, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Data written to file system successfully.");
          }
          // file written successfully
        });

        const username = await this.db_handler.GetUserIDFromToken(
          await this.GetSessionTokenFromString(token_string)
        );

        const transaction_buffer = Buffer.from(JSON.stringify(file_buffer));
        const binary_string = transaction_buffer.toString();
        const file_hash = await encryption_handler.GetHash(binary_string);
        // console.log(file_hash.toString());

        if (
          await this.db_handler.UploadFile(
            {
              binary_data: file_buffer,
              fileName: file_data.name,
              userID: username,
              type: file_data.type,
              size: file_data.size,
              description: file_data.description,
              hash: file_hash.toString(),
              timestamp: file_data.timeStamp,
              path: `${fs_name}`,
            },
            `${fs_name}`
          )
        ) {
          console.log("Data successfully uploaded.");

          // generate transaction and send to blockchain miner
          // miner.HandleNewFile(file_hash.toString(), new Date().toISOString())
          // miner.postMessage(
          //   `${JSON.stringify({
          //     type: "newFile",
          //     data: {
          //       hash: file_hash.toString(),
          //       date: new Date().toISOString(),
          //     },
          //   })}`
          // );
        }
      }

      async GetFile(file_id) {
        const file_data = await this.db_handler.GetFile(file_id);
        // const parsed_data = JSON.parse(file_data.fileName);
        return file_data;
      }
    }

    (async function () {
      api_data_handler = new CompanyDataHandler();
    })();

    //#endregion
  } catch (err) {
    console.log(err);
  }

  //#endregion
  //
} catch (err) {
  console.error(err);
  parentPort.postMessage({ message: "Error", error: err });
}
