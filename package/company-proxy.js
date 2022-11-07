const http = require("http");
const fs = require("fs").promises;
const axios = require("axios");
const web_server_address = `localhost:8000`;

const port = 3000;

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

(async function () {
  console.log("Company-proxy deployed.\nRequesting auth token...");
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
})();
