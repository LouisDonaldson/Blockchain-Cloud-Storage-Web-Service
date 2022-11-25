const http = require("http");
const fs = require("fs").promises;
const axios = require("axios");
const web_server_address = `localhost:8000`;
const encryption_handler = require("../encryption_handler");
//#region Global variables
let ping = false;
let caching = true;
const admin_log_in = {
  username: "admin",
  password: "password",
};
let company_id = 1;
let company_name = "CompTest";
const port = 3001;
//#endregion

// only cache HTML, CSS and JS. Dynamic data does not require caching.
let cache = {};

function CheckCache(key) {
  if (!caching) return false;
  for (const [k, v] of Object.entries(cache)) {
    if (key == k) {
      return v;
    }
  }
}

// const temp_token = btoa("this is a temporary token");

const server_handler = async (req, res) => {
  console.log(
    `Incoming request for: ${req.url} (${req.connection.remoteAddress})`
  );
  if (req.url.includes("miner")) {
    // Route to specific handler
  } else if (req.url.slice(0, 6) == "/init/") {
    // old
    // specific init handler
    // temp
    const token = Token_Handler.GetNewToken();
    const body = { auth_token: token.toString() };
    console.log(
      `Auth token requested.\nAttached to response.\nToken: '${token.toString()}'`
    );
    res.end(JSON.stringify(body));
  } else {
    api_website_handler.HandleRequest(req, res);
  }
};

const api_website_handler = {
  HandleRequest: async function (req, res) {
    if (req.url.includes("client-data")) {
    } else if (req.url == "/ping") {
      res.writeHead(200);
      res.end();
      // Route to specific handler
    } else {
      if (req.headers?.auth_token) {
        // check token authenticity here
        if (!Token_Handler.CheckToken(req.headers.auth_token)) {
          res.writeHead(401);
          res.end("Unauthorised client");
          return;
        }
        // auth_handler.CheckToken();
      } else {
        res.writeHead(401);
        res.end("Unauthorised client");
        return;
      }
      let response;
      if (CheckCache(req.url)) {
        response = CheckCache(req.url);
      }
      try {
        response = await axios({
          method: "get",
          url: `http://${web_server_address}${req.url}`,
          headers: {
            auth_token: this.server_token,
          },
        });
        const data = response.data;
        cache[req.url] = data;
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
    }
  },
};

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

const original_ping_interval = 5000;
let ping_interval = 5000;

(async function () {
  console.log(
    `Company-proxy deployed.\nCompany ID set to '1' by default. Variable is 'company_id'.`
  );

  // Ping web-server to make sure it's up
  console.log("Pinging web-server...");
  try {
    if (PingWebServer()) {
      console.log("Response from web-server.");
    }
  } catch (err) {
    console.log("No response from web-server...");
    throw new Error("Web-server not active");
  }

  try {
    api_website_handler.server_token = await GetServerToken();
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
  console.log("Company proxy-server HTTP service running on port " + port);

  if (ping) {
    console.log("Starting ping intervals to web-server.");
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

let auth_tokens = [];
const Token_Handler = {
  GetNewToken: function () {
    const token = encryption_handler.GenerateRandomToken();
    console.log(token.toString());
    auth_tokens.push(token);
    return token;
  },
  CheckToken: (token) => {
    for (const _token of auth_tokens) {
      const token_string = _token.toString();
      if (token == token_string) {
        return true;
      }
    }
    return false;
  },
};
