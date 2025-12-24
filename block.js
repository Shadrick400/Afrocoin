const SHA256 = require("crypto-js/sha256");

class Block {
    constructor(timestamp, transactions, previousHash = "") {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions) +
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== "0".repeat(difficulty)) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("⛏ Block mined:", this.hash);
    }

    // Compatibility getter: some demos expect `block.data` to refer to transactions
    get data() {
        return this.transactions;
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

    static fromJSON(data) {
        // We need to require Transaction here to avoid circular dependency issues at top level if possible, 
        // or just assume it is available if referenced correctly. 
        // Better: Pass Transaction class or rely on the one in scope if we modify this file to require it.
        // Actually, Block already requires crypto-js but NOT Transaction. 
        // We should move 'Transaction' requirement to top or handle it.
        // Let's assume the data.transactions are objects and we leave them as objects? 
        // NO, block.hasValidTransactions() calls tx.isValid(), so they MUST be instances.

        // We need to import Transaction.
        const Transaction = require('./transaction');

        const transactions = data.transactions.map(tx => Transaction.fromJSON(tx));
        const block = new Block(data.timestamp, transactions, data.previousHash);
        block.hash = data.hash;
        block.nonce = data.nonce;
        return block;
    }
}

module.exports = Block;
