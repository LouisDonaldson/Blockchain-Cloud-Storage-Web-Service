const http = require("http");
const fs = require("fs").promises;

module.exports = {
  HandleRequest: async function (req, res) {
    //#region Index
    if (req.url == "/") {
      fs.readFile(__dirname + `/website/index/index.html`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/html",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    } else if (req.url == "/index.js") {
      fs.readFile(__dirname + `/website/index/index.js`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/javascript",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    } else if (req.url == "/index.css") {
      fs.readFile(__dirname + `/website/index/index.css`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/css",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    }
    //#endregion
    //#region Portal
    else if (req.url == "/portal") {
      fs.readFile(__dirname + `/website/portal/portal.html`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/html",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    } else if (req.url == "/portal.css") {
      fs.readFile(__dirname + `/website/portal/portal.css`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/css",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    } else if (req.url == "/portal.js") {
      fs.readFile(__dirname + `/website/portal/portal.js`)
        .then((contents) => {
          res.writeHead(200, {
            "Content-type": "text/javascript",
          });
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    }
    //#endregion
    //#region Misc
    else if (req.url.includes("/images/")) {
      const image = await fs.readFile(__dirname + "/website/" + `${req.url}`);
      res.writeHead(200, {
        "Content-Type": "image/svg+xml",
      });
      res.end(image);
    } else if (req.url.includes("/font/")) {
      const contents = await fs.readFile(
        __dirname + "/website/" + `${req.url}`
      );
      res.writeHead(200, {
        "Content-Type": "font/ttf",
      });
      res.end(contents);
    }
    //#endregion

    //#region blockchain
    else if (req.url.includes("/blockchain/")) {
      if (req.url.includes("/init")) {
        // return init data back to miner
      }
    }
    //#endregion

    //#region Default Response
    // Ensure this is at the bottom of the page
    else {
      res.writeHead(404);
      res.end("<h1>404 Not found</h1>");
    }
    //#endregion
  },
};
