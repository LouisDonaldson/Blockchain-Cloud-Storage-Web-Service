module.exports = class Database_Handle {
  constructor(offline_dev = false) {
    this.offline_dev = offline_dev;
    console.log("Database handler created.");
  }
};
