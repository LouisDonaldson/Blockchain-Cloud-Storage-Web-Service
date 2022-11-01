const http = require('http');
const axios = require("axios")

const test_handler = {
    RunTests: async function (debug = false) {
        console.log("Running tests...")
        await this.WebServerTests(debug)
        console.log("Web server tests complete.")
        console.log("Tests complete.")
    },
    WebServerTests: function (debug = false) {
        return new Promise(async (resolve, reject) => {
            // Gets homepage code
            const WebServerTestOne = () => {
                return new Promise(async (resolve, reject) => {
                    const response = await axios({
                        method: 'get',
                        url: 'http://192.168.1.122:8000',
                    })

                    if (debug) {
                        console.log(`Status: ${response.status}`)
                        console.log(response.data);
                    }
                    response.status == 200 && response.data.includes("html") ? resolve() : reject()
                })
            }

            // Checks to see if an incorrect request does not break it
            const WebServerTestTwo = () => {
                return new Promise(async (resolve, reject) => {
                    let response;
                    try {
                        response = await axios({
                            method: 'get',
                            url: 'http://192.168.1.122:8000/page_something.html',
                        })

                        if (debug) {
                            console.log(`Status: ${response.status}`)
                            console.log(response.data);
                        }
                        reject();
                    }
                    catch (err) {
                        debug ? console.log(err) : "";
                        err.response.status == 404 ? resolve() : reject()

                    }
                })
            }

            console.log("Running WebServerTestOne.")
            await WebServerTestOne(debug);
            await WebServerTestTwo(debug)
            resolve()
        })

    }
}

// const MakeRequest = async () => {
//     return new Promise(async (resolve, reject) => {
//         const response = await axios({
//             method: 'get',
//             url: 'http://192.168.1.122:8000',
//         })

//         resolve(response)
//     })
// }

// MakeRequest().then(response => {
//     const response_data = response.data
//     console.log(response_data)
//     // console.log((Buffer.from(response.data)).toString())
// });


const debug = true
test_handler.RunTests(debug)