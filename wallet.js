const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // Same curve as Bitcoin

class Wallet {
    constructor() {
        this.keyPair = ec.genKeyPair();
        this.privateKey = this.keyPair.getPrivate("hex");
        this.address = this.keyPair.getPublic("hex");
    }
}

module.exports = Wallet;
