// Company Server
/*
Contains the main business logic of the company. Handles requests to the database, 
deals with client interaction as well as well as routes data to and from the blockchain miner

Sits behind the company gateway server
*/

let ping = false;

const http = require("http");
const fs = require("fs").promises;
const axios = require("axios");
const web_server_address = `localhost:3001`;
const database_handler = require("./database/company_database_handler.js");
const encryption_handler = require("../encryption_handler");
const miner = require("../blockchain/miner");

//#region Global variables
const port = 3000;
const original_ping_interval = 5000;
let ping_interval = 5000;
let api_data_handler;
//#endregion

const server_handler = async (req, res) => {
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

            req.on("data", (chunk) => {
              incomingData += chunk.toString(); // convert Buffer to string
            });
            req.on("end", () => {
              // handle response here
              console.log("File data read. No errors.");
              res.writeHead(200);
              res.end();
              api_data_handler.HandleFileUpload(
                incomingData,
                req.headers.cookie
              );
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
      } else if (req.url.includes("/data")) {
        api_data_handler.SendCurrentData(req, res);
      } else if (req.url.includes("/fileMeta")) {
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
        if (
          await api_data_handler.CheckCookie(
            split_cookie[1].slice(0, split_cookie[1].length - 1)
          )
        ) {
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
    this.db_handler = new database_handler(encryption_handler.GetHash);
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
        user_data: this.db_handler.GetUserData(req),
        name: this.config_file.name,
        logo: await fs.readFile(this.config_file.logo_path),
        files: await this.db_handler.GetFileMeta(),
      })
    );
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
        return split_cookie[1].slice(0, split_cookie[1].length - 1);
      }
    }
  }
  async CheckCookie(cookie_string) {
    return await this.db_handler.CheckToken(cookie_string);
  }
  async HandleFileUpload(data_obj_json, token_string) {
    console.log("Uploading data to database.");
    const data_obj = JSON.parse(data_obj_json);
    // data_obj

    // file name = obj.name
    // file data = obj.binaryString
    let file_buffer = data_obj.binaryString;

    const username = await this.db_handler.GetUserIDFromToken(
      await this.GetSessionTokenFromString(token_string)
    );

    const transaction_buffer = Buffer.from(JSON.stringify(file_buffer));
    const binary_string = transaction_buffer.toString();
    const file_hash = await encryption_handler.GetHash(binary_string);
    // console.log(file_hash.toString());

    if (
      await this.db_handler.UploadFile({
        binary_data: file_buffer,
        fileName: data_obj.name,
        userID: username,
        description: data_obj.description,
        hash: file_hash.toString()
      })
    ) {
      console.log(
        "Data successfully uploaded.\nGenerating transaction for miner..."
      );

      // generate transaction and send to blockchain miner
      miner.HandleNewFile(file_hash.toString(), new Date().toISOString())
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
  const server = http
    .createServer(async (req, res) => {
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
