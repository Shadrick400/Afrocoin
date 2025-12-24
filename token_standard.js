const SHA256 = require('crypto-js/sha256');

class ERC20Token {
    constructor(name, symbol, decimals = 18, totalSupply = 0) {
        this.name = name;
        this.symbol = symbol;
        this.decimals = decimals;
        this.totalSupply = totalSupply;
        this.balances = {};
        this.address = SHA256(name + symbol + Date.now()).toString();
    }

    // Initialize token distribution to deployer
    initialize(deployer) {
        this.balances = this.balances || {};
        this.balances[deployer] = (this.balances[deployer] || 0) + this.totalSupply;
    }

    balanceOf(address) {
        return this.balances[address] || 0;
    }

    transfer(from, to, amount) {
        amount = Number(amount);
        if (!this.balances[from] || this.balances[from] < amount) return false;
        this.balances[from] -= amount;
        this.balances[to] = (this.balances[to] || 0) + amount;
        return true;
    }

    // Convenience for tests
    totalSupply() {
        return this.totalSupply;
    }
}

module.exports = ERC20Token;