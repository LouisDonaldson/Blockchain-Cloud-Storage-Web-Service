const http = require("http");
const fs = require("fs").promises;
const port = 8000;
const api_website_handler = require("./website_handler.js")

const server = http
    .createServer(async (req, res) => {
        server_handler(req, res)
    })
    .listen(port);
console.log("Server running on port " + port)


const server_handler = async (req, res) => {
    console.log(req.url);
    if (req.url.includes("/spotify/")) {
        // Route to specific handler

    }
    else {
        api_website_handler.HandleRequest(req, res)
    }
}


