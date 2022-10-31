var http = require('http');

//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'




const test_handler = {
    RunTests: async function (debug = false) {
        console.log("Running tests...")
        const response = await this.WebServerTests(debug)
        console.log("Web server tests complete.")
        console.log("Tests complete.")
    },
    WebServerTests: function (debug = false) {
        const WebServerTestOne = (debug = false) => {
            return new Promise((resolve, reject) => {
                var options = {
                    host: '192.168.1.122',
                    port: '8000',
                    method: 'GET',
                    path: '/'
                };

                callback = function (response) {
                    var str = '';

                    //another chunk of data has been received, so append it to `str`
                    response.on('data', function (chunk) {
                        str += chunk;
                    });

                    //the whole response has been received, so we just print it out here
                    response.on('end', function () {
                        if (debug) {
                            console.log(str);
                            resolve()
                        }
                    });
                }

                http.request(options, callback).end();
            })
        }

        console.log("Running WebServerTestOne.")
        WebServerTestOne(debug);
    }
}

test_handler.RunTests(false)