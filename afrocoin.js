const Transaction = require("./transaction");

class Afrocoin {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 25;
    }
=======
const Block = require("./block");
const Transaction = require("./transaction");
const ERC20Token = require("./token_standard");

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
