const http = require("http");
const fs = require("fs").promises;
const port = 8000;

const server = http
  .createServer(async (req, res) => {
    console.log(req.url);
    if (req.url == "/") {
      fs.readFile(__dirname + `/website/index.html`)
        .then((contents) => {
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    } else if (req.url == "/index.js") {
      fs.readFile(__dirname + `/website/index.js`)
        .then((contents) => {
          res.end(contents);
        })
        .catch((err) => {
          throw err;
        });
    }
    // else if (req.url.includes("/images/")) {
    //     const image = await fs.readFile(__dirname + `${req.url}`)
    //     res.write(image)
    // }
    else {
      res.writeHead(404);
      res.end("<h1>404 Not found</h1>");
    }
  })
  .listen(port);
