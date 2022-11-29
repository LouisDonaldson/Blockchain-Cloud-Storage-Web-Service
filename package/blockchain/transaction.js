module.exports = class Transaction {
  constructor(new_id, transaction_meta) {
    this.id = new_id;
    this.meta = transaction_meta;
  }
};
