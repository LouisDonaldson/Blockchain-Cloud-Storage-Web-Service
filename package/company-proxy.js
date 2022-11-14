const http = require("http");
const fs = require("fs").promises;
const axios = require("axios");
const web_server_address = `localhost:8000`;

//#region Global variables
const admin_log_in = {
  username: "admin",
  password: "password",
};
let company_id = 1;
const port = 3000;
//#endregion

const server_handler = async (req, res) => {
  console.log(
    `Incoming request for: ${req.url} (${req.connection.remoteAddress})`
  );
  if (req.url.includes("/spotify/")) {
    // Route to specific handler
  } else {
    api_website_handler.HandleRequest(req, res);
  }
};

const api_website_handler = {
  HandleRequest: async function (req, res) {
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

  console.log("Starting ping intervals to web-server.");
  PingIntervals(ping_interval);
})();

function PingIntervals(time) {
  setTimeout(async () => {
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
  }, time);
}
