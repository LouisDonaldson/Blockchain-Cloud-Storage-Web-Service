const crpyto_js = require("crypto-js");

module.exports = {
  GenerateRandomToken(optional_string = "") {
    const token = crpyto_js.SHA256(
      JSON.stringify({
        date: new Date().toISOString(),
        optional_string: optional_string,
      })
    );
    return token;
  },
  async GetHash(object) {
    const hash = await crpyto_js.SHA256(JSON.stringify(object));
    return hash;
  },
};
