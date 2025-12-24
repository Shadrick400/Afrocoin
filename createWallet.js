const Wallet = require("./wallet");

const wallet = new Wallet();

console.log("SAVE THIS SAFELY");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
