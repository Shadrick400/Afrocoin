const Block = require("./block");
const Transaction = require("./transaction");
const SHA256 = require('crypto-js/sha256');

class Afrocoin {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 25;
        // Smart contract storage
        this.contracts = new Map();
        // Token contracts storage
        this.tokens = new Map();
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const transactionsToMine = this.pendingTransactions.slice();
        // Calculate total fees included in pending transactions
        const totalFees = transactionsToMine.reduce((acc, tx) => acc + (tx.fee || 0), 0);

        // Include miner reward + fees as a reward transaction
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward + totalFees);
        transactionsToMine.push(rewardTx);

        const block = new Block(Date.now(), transactionsToMine, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        this.chain.push(block);

        // Persist chain to disk (basic checkpoint)
        try {
            const fs = require('fs');
            const path = require('path');
            const statePath = path.resolve(__dirname, 'chain_state.json');
            const serial = {
                chain: this.chain.map(b => ({ timestamp: b.timestamp, transactions: b.transactions, previousHash: b.previousHash, hash: b.hash, nonce: b.nonce }))
            };
            fs.writeFileSync(statePath, JSON.stringify(serial, null, 2), 'utf8');
        } catch (e) {
            console.warn('Warning: failed to persist chain state', e.message);
        }

        // Clear pending transactions
        this.pendingTransactions = [];
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to addresses');
        }

        // Amount must be positive
        if (typeof transaction.amount !== 'number' || Number.isNaN(transaction.amount) || transaction.amount <= 0) {
            throw new Error('Transaction amount must be a positive number');
        }

        // Ensure signer is valid
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to the chain');
        }

        // Prevent overspending: available balance must cover amount + fee
        const fee = transaction.fee || 0;
        const senderBalance = this.balance(transaction.fromAddress);
        if (senderBalance < (transaction.amount + fee)) {
            throw new Error('Insufficient balance');
        }

        this.pendingTransactions.push(transaction);
    }

    // Compatibility: high-level send API expected by demo.js
    send(from, to, amount, signingKey) {
        const tx = new Transaction(from, to, amount);
        if (signingKey) {
            tx.signTransaction(signingKey);
        }
        this.addTransaction(tx);
    }

    // Compatibility: shorthand mine() expected by demo.js
    mine(minerAddress) {
        this.minePendingTransactions(minerAddress);
    }

    balance(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address) {
                    balance -= (tx.amount + (tx.fee || 0));
                }

                if (tx.toAddress === address) {
                    balance += tx.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }
        }
        return true;
    }

    deployContract(contract) {
        this.contracts.set(contract.address, contract);
        try {
            // Call constructor with owner as parameter (best-effort)
            contract.execute('constructor', [contract.ownerAddress], contract.ownerAddress, this);
        } catch (e) {
            // Ignore if constructor not present
        }

        return contract.address;
    }

    callContract(contractAddress, methodName, params = []) {
        const contract = this.contracts.get(contractAddress);
        if (!contract) throw new Error('Contract not found');
        return contract.execute(methodName, params, null, this);
    }

    deployToken(token, deployer) {
        // Ensure token has an address
        if (!token.address) {
            token.address = SHA256(token.name + token.symbol + Date.now()).toString();
        }

        if (typeof token.initialize === 'function') {
            token.initialize(deployer);
        } else {
            // fallback if token uses _totalSupply property
            token.balances = token.balances || {};
            token.balances[deployer] = token.totalSupply || token._totalSupply || 0;
        }

        this.tokens.set(token.address, token);
        return token.address;
    }

    callToken(tokenAddress, methodName, params = []) {
        const token = this.tokens.get(tokenAddress);
        if (!token) throw new Error('Token not found');
        if (typeof token[methodName] === 'function') return token[methodName](...params);
        if (Object.prototype.hasOwnProperty.call(token, methodName)) return token[methodName];
        throw new Error('Token method not found');
    }
}

module.exports = Afrocoin;
