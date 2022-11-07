const http = require("http");
const fs = require("fs").promises;
const port = 8000;
const api_website_handler = require("./website_handler.js");
const database_handler = require("./database_handler.js");

const temp_token = btoa("this is a temporary token");

const server = http
  .createServer(async (req, res) => {
    server_handler(req, res);
  })
  .listen(port);
console.log("Server running on port " + port);

const server_handler = async (req, res) => {
  console.log(req.url);
  //   if (req.headers?.auth_token) {
  //     // check token authenticity here
  //     if (req.headers?.auth_token ?? undefined != temp_token) {
  //       res.writeHead(401);
  //       res.end("Unauthorised client");
  //       return;
  //     }
  //     // auth_handler.CheckToken();
  //   } else if (req.url.slice(0, 6) != "/init/") {
  //     res.writeHead(401);
  //     res.end("Unauthorised client");
  //     return;
  //   }
  //   req.headers?.auth_token ? console.log(req.headers?.auth_token ?? "") : "";
  if (false) {
    // Route to specific handler
  } else if (req.url.slice(0, 6) == "/init/") {
    // specific init handler
    // temp
    const body = { auth_token: temp_token };
    console.log(
      `Auth token requested.\nAttached to response.\nToken: '${temp_token}'`
    );
    res.end(/* temp token */ JSON.stringify(body));
    //
  } else {
    if (req.headers?.auth_token) {
      // check token authenticity here
      if (req.headers?.auth_token != temp_token) {
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
    req.headers?.auth_token ? console.log(req.headers?.auth_token ?? "") : "";
    api_website_handler.HandleRequest(req, res);
  }
};
