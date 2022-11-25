const http = require("http");
const fs = require("fs").promises;
const port = 8000;
const api_website_handler = require("./website_handler.js");
const database_handler = require("./database_handler.js");
const { buffer } = require("stream/consumers");
const encryption_handler = require("./encryption_handler");

// const temp_token = btoa("this is a temporary token");
const db_handler = new database_handler();

const server = http
  .createServer(async (req, res) => {
    server_handler(req, res);
  })
  .listen(port);
console.log("Server running on port " + port);

const server_handler = async (req, res) => {
  console.log(
    `Incoming request for: ${req.url} (${req.connection.remoteAddress})`
  );
  if (req.url == "/ping") {
    res.writeHead(200);
    res.end();
    // Route to specific handler
  } else if (req.url.slice(0, 6) == "/init/") {
    // specific init handler
    // temp
    const token = Token_Handler.GetNewToken();
    const body = { auth_token: token.toString() };
    console.log(
      `Auth token requested.\nAttached to response.\nToken: '${token.toString()}'`
    );
    res.end(/* temp token */ JSON.stringify(body));
    //
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
    // req.headers?.auth_token ? console.log(req.headers?.auth_token ?? "") : "";
    api_website_handler.HandleRequest(req, res);
  }
};

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
