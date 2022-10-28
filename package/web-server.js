const http = require("http");
const fs = require("fs").promises
const port = 8000

const server = http.createServer(async (req, res) => {
    switch (req.url) {
        case "/":
            fs.readFile(__dirname + `/website/index.html`)
                .then(contents => {
                    res.end(contents)
                })
            break;
    }
}).listen(port)