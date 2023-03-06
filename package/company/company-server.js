// Company Server
/*
Contains the main business logic of the company. Handles requests to the database, 
deals with client interaction as well as well as routes data to and from the blockchain miner

Sits behind the company gateway server
*/

const { Worker } = require("node:worker_threads");
/*

const express = require("express");
const { Worker } = require("worker_threads");
...
app.get("/blocking", async (req, res) => {
  const worker = new Worker("./worker.js");
  worker.postMessage([data])
  worker.on("message", (data) => {
    res.status(200).send(`result is ${data}`);
  });
  worker.on("error", (msg) => {
    res.status(404).send(`An error occurred: ${msg}`);
  });
});

*/

let ping = false;

const ip = require("ip");

const http = require("http");
const fs_promises = require("fs").promises;
const fs = require("fs");
const axios = require("axios");
const web_server_address = `localhost:3001`;
const database_handler = require("./database/company_database_handler.js");
const encryption_handler = require("../encryption_handler");
const BlockchainHandler = require("./BlockchainHandler.js");
const WorkerHandler = new require("./WorkerHandler.js");
const crypto = require("crypto-js");

// const miner = require("../blockchain/miner");
// const { Worker } = require("node:worker_threads");
// const miner = new Worker("../blockchain/miner");
let blockchain_handler;
let worker_handler;

//#region Global variables
const port = 3000;
const original_ping_interval = 5000;
let ping_interval = 5000;
let api_data_handler;
let machine_address = ip.address();
//#endregion

// let worker;
// worker = new Worker(__dirname + "/worker.js");
// worker.on("error", (msg) => {
//   console.log(`An error occurred: ${msg}`);
// });

const server_handler = async (req, res) => {
  // const _worker = new worker.Worker(__dirname + "/worker.js");
  console.log(
    `Incoming request for: ${req.url} (${req.connection.remoteAddress})`
  );
  if (false) {
    // send back file names from DB as well as data from config file
    api_data_handler.SendCurrentData(req, res);
  } else if (req.url.includes("/login")) {
    // check auth here
    if (
      req.headers?.username != undefined &&
      req.headers?.password != undefined
    ) {
      const username = req.headers?.username;
      const password = req.headers?.password;
      const response = await api_data_handler.CheckAuth(username, password);
      if (response.auth) {
        // auth was successful
        // auth: bool
        // token: string
        console.log(res);
        const token_string = response.token.toString();
        res.writeHead(200, {
          cookies: { session_token: token_string },
        });
        res.end(
          JSON.stringify({
            successful: true,
            token: token_string,
          })
        );
        // attach session token to cookie. next request
      } else {
        res.end(
          JSON.stringify({
            error: "Username or password incorrect",
          })
        );
      }
    } else {
      res.writeHead(404, "Username and/or password not present in headers");
      res.end();
    }
  } else if (req.url.includes("/register")) {
    // user has requested to register an account
    if (
      req.headers?.name != undefined &&
      req.headers?.username != undefined &&
      req.headers?.password != undefined
    ) {
      const name = req.headers?.name;
      const username = req.headers?.username;
      const password = req.headers?.password;

      const response = await api_data_handler.RegisterUser(
        name,
        username,
        password
      );
      if (response == 200) {
        res.writeHead(200);
        res.end("200");
      } else {
        res.writeHead(404);
        res.end(JSON.stringify(response));
      }
    } else {
      res.writeHead(404);
      res.end(
        JSON.stringify({
          message: "Name, username or password not present in headers.",
        })
      );
    }
  } else {
    api_website_files_handler.HandleRequest(req, res);
  }
};

const api_website_files_handler = {
  HandleRequest: async function (req, res, check_auth = true) {
    const default_route_request = async (req, res) => {
      let response;
      try {
        response = await axios({
          method: "get",
          url: `http://${web_server_address}${req.url}`,
          headers: {
            auth_token: this.server_token,
          },
        });
        const data = response.data;

        res.writeHead(response.status, {
          "Content-type": response?.headers?.["content-type"] ?? "",
        });
        res.end(data);
      } catch (err) {
        console.log("Axios error:");
        console.error(err);
        if (response?.status) {
          res.writeHead(response?.status);
        } else {
          res.writeHead(502);
        }
        res.end();
      }
    };

    const auth_route_request = async (req, res) => {
      let response;
      try {
        response = await axios({
          method: "get",
          url: `http://${web_server_address}/portal`,
          headers: {
            auth_token: this.server_token,
          },
        });
        const data = response.data;

        res.writeHead(response.status, {
          "Content-type": response?.headers?.["content-type"] ?? "",
        });
        res.end(data);
      } catch (err) {
        console.log("Axios error:");
        console.error(err);
        if (response?.status) {
          res.writeHead(response?.status);
        } else {
          res.writeHead(502);
        }
        res.end();
      }
    };

    const Unauthorised_User_Route = async (req, res) => {
      res.end(
        `<a href="/">Unauthorised. Click to go to the homepage and log in.</a>`
      );
    };

    if (check_auth) {
      if (req.url == "/") {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            // cookie authorised
            console.log(req.headers);

            // temp
            auth_route_request(req, res);
          } else {
            // cookie unauthorised
            default_route_request(req, res);
          }
        } else {
          default_route_request(req, res);
        }
      } else if (req.url == "/file" && req.method == "POST") {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            // cookie authorised

            // handle file upload here
            let incomingData = "";
            console.log("Incoming file transmission.");

            // const message = {
            //   message: "incoming file",
            //   data: {
            //     req: req,
            //     res: res,
            //   },
            // };
            // worker.postMessage(message);

            req.on("data", async (chunk) => {
              incomingData += chunk.toString(); // convert Buffer to string
            });
            req.on("end", async () => {
              // handle response here
              console.log("File data read. No errors.");
              res.writeHead(200);
              res.end();

              //#region Worker code
              worker_handler.ActivateWorker({
                message: "File upload",
                data: {
                  data: JSON.stringify(incomingData),
                  cookie: req.headers.cookie,
                },
              });

              //#endregion
            });
          } else {
            // cookie unauthorised
            res.writeHead(404);
            res.end();
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      } else if (req.url == "/portal") {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            default_route_request(req, res);
          } else {
            Unauthorised_User_Route(req, res);
          }
        } else {
          Unauthorised_User_Route(req, res);
        }
      } else if (req.url.includes("/fileMeta")) {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            api_data_handler.SendFileMetaData(req, res);
          } else {
            // cookie not authed
            res.writeHead(401);
            res.end();
          }
        } else {
        }
      } else if (req.url.includes("/company_data")) {
        const body = {
          name: api_data_handler.config_file.name,
          logo: await fs_promises.readFile(
            api_data_handler.config_file.logo_path
          ),
        };
        res.writeHead(200);
        res.end(JSON.stringify(body));
      } else if (req.url.includes("/initial")) {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            api_data_handler.SendCurrentData(req, res);
          } else {
            // cookie not authed
            res.writeHead(401);
            res.end();
          }
        } else {
        }
      } else if (req.url.includes("/filedata?")) {
        if (req.headers?.cookie) {
          if (
            await api_website_files_handler.CheckValidSessionCookie(
              req.headers.cookie
            )
          ) {
            let worker = worker_handler.ActivateWorker({
              message: "File download",
              data: {
                request_url: req.url,
                cookie: req.headers?.cookie,
              },
            });

            worker.once("message", (message) => {
              if (message.message == "Successful") {
                console.log(
                  "File received from system.\nReturning file to Client."
                );
                res.writeHead(200);
                res.end(message.data);
              } else {
                Unauthorised_User_Route(req, res);
              }
            });
          }
        }
      } else {
        default_route_request(req, res);
      }
    } else {
      default_route_request(req, res);
    }
  },
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

class CompanyDataHandler {
  constructor() {
    this.db_handler = new database_handler(
      encryption_handler.GetHash,
      encryption_handler.GenerateRandomToken
    );
    this.session_tokens = [];
    (async () => {
      this.config_file = await this.db_handler.GetConfigFile();
      this.blockchain_handler = new BlockchainHandler(
        this.config_file.num_miners,
        machine_address,
        port
      );
      this.blockchain_handler.InitialiseConnection().catch((err) => {
        console.error(
          "Error when intialising blockchain connection: " + err.message
        );
      });
      blockchain_handler = this.blockchain_handler;
    })();
  }
  // what gets sent back to client every time it makes a request // only on portal page
  async SendCurrentData(req, res) {
    // res.end(JSON.stringify(await db_handler.GetConfigFile()))
    // this.config_file = await this.db_handler.GetConfigFile();
    const user_data = await this.GetUserData(req);
    let files = await this.db_handler.GetFileMeta();
    if (user_data.Permission_Level != 1) {
      files = files.filter((file) => {
        if (file.authorised == 1 || file.userID == user_data.ID) {
          return file;
        }
      });
    }

    res.end(
      JSON.stringify({
        user_data: user_data,
        name: this.config_file.name,
        logo: await fs_promises.readFile(this.config_file.logo_path),
        files: files,
      })
    );
  }

  async SendFileMetaData(req, res) {
    // res.end(JSON.stringify(await db_handler.GetConfigFile()))
    // this.config_file = await this.db_handler.GetConfigFile();
    const user_data = await this.GetUserData(req);
    let files = await this.db_handler.GetFileMeta();
    if (user_data.Permission_Level != 1) {
      files = files.filter((file) => {
        if (file.authorised == 1 || file.userID == user_data.ID) {
          return file;
        }
      });
    }

    res.end(
      JSON.stringify({
        files: files,
      })
    );
  }

  async SendInitialData(req, res) {
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
        api_website_files_handler.CheckValidSessionCookie(req.headers?.cookie)
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

  // look on worker.js for file upload
  async HandleFileUpload(data_obj_json, token_string, file_name) {
    console.log("Uploading data to database.");
    const data_obj = JSON.parse(data_obj_json);
    const file_data = JSON.parse(JSON.parse(data_obj.file));
    const dateTime = data_obj.dateTime;

    // data_obj

    let file_buffer = file_data.binaryString;

    const file_data_entries = Object.entries(file_buffer);
    const array = [];

    for (const i in file_data_entries) {
      // view[i] = file_data_entries[i][1];
      array[i] = file_data_entries[i][1];
    }

    const fs_buffer = Buffer.from(array);

    // write file to file system

    const fs_name = `${this.config_file.file_path}/${file_data.name}`;
    // const fs_data = JSON.stringify({
    //   data: file_buffer,
    // });

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
      console.log(
        "Data successfully uploaded.\nGenerating transaction for miner..."
      );

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

  // look on worker.js for file download
  async GetFile(file_id) {
    const file_data = await this.db_handler.GetFile(file_id);
    // const parsed_data = JSON.parse(file_data.fileName);
    return file_data;
  }

  async RegisterUser(name, username, password) {
    try {
      const response = await this.db_handler.RegisterUser(
        name,
        username,
        password
      );

      return response;
    } catch (err) {
      return {
        Message: "Error when registering user.",
        Error: err,
      };
    }
  }
}

function GetServerToken() {
  return new Promise((resolve, reject) => {
    axios(`http://${web_server_address}/init/token`, {})
      .then((response) => {
        const token = response?.data?.auth_token ?? undefined;
        if (token != undefined) {
          resolve(token);
        } else {
          reject("Token not present in response.");
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });
}

async function PingWebServer() {
  return new Promise((resolve, reject) => {
    axios(`http://${web_server_address}/ping`)
      .then((response) => {
        if (response.status == 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

(async function () {
  worker_handler = new WorkerHandler();
  api_data_handler = new CompanyDataHandler();
  console.log(
    `Company-proxy deployed.\nCompany ID set to '1' by default. Variable is 'company_id'.`
  );

  // Ping web-server to make sure it's up
  console.log("Pinging gateway...");
  try {
    if (PingWebServer()) {
      console.log("Response from gateway.");
    }
  } catch (err) {
    console.log("No response from gateway...");
    throw new Error("gateway not active");
  }

  try {
    api_website_files_handler.server_token = await GetServerToken();
    console.log("Auth token received");
  } catch (err) {
    throw new Error(`Auth token wasn't retrieved.`);
  }

  console.log("Starting HTTP service...");
  const server = await http
    .createServer(async (req, res) => {
      // console.log(server)
      server_handler(req, res);
    })
    .listen(port);
  console.log("Company server HTTP service running on port " + port);

  if (ping) {
    console.log("Starting ping intervals to proxy.");
    PingIntervals(ping_interval);
  }
})();

function PingIntervals(time) {
  setTimeout(async () => {
    if (ping) {
      try {
        const active = await PingWebServer();
        if (active) {
          console.log("Ping successful.");
          ping_interval = original_ping_interval;
          PingIntervals(ping_interval);
        }
      } catch (err) {
        console.log("Ping failed...");
        ping_interval = ping_interval + 5000;
        console.log(`Retrying in '${ping_interval / 1000}' seconds.`);
        PingIntervals(ping_interval);
      }
    }
  }, time);
}
