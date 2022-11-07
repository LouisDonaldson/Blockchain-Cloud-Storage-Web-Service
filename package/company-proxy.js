const http = require("http");
const fs = require("fs").promises;
const axios = require("axios");
const web_server_address = `localhost:8000`;

const port = 3000;

const server = http
  .createServer(async (req, res) => {
    server_handler(req, res);
  })
  .listen(port);
console.log("Company proxy-server running on port " + port);

const server_handler = async (req, res) => {
  console.log(req.url);
  if (req.url.includes("/spotify/")) {
    // Route to specific handler
  } else {
    api_website_handler.HandleRequest(req, res);
  }
};

const api_website_handler = {
  HandleRequest: async function (req, res) {
    const response = await axios({
      method: "get",
      url: `http://${web_server_address}${req.url}`,
    });
    const data = response.data;

    res.writeHead(200, response.headers);
    res.end(data);
  },
};
