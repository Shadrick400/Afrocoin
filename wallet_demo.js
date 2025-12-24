const Afrocoin = require("./afrocoin");
const Wallet = require("./wallet");

console.log("🚀 Starting Afrocoin Wallet Demo\n");

const afrocoin = new Afrocoin();

// Create wallets
const minerWallet = new Wallet();
const aliceWallet = new Wallet();
const bobWallet = new Wallet();

console.log("👛 Wallets Created:");
console.log("━".repeat(50));
console.log("Miner Address:", minerWallet.address.substring(0, 40) + "...");
console.log("Alice Address:", aliceWallet.address.substring(0, 40) + "...");
console.log("Bob Address:", bobWallet.address.substring(0, 40) + "...");
console.log("");

// Mine first block to get mining reward
console.log("⛏️  Miner mines first block...");
afrocoin.mine(minerWallet.address);
console.log("✅ Block mined! Miner receives 25 Afrocoins reward\n");

// Check balances after mining
console.log("💰 Balances after mining:");
console.log("   Miner:", afrocoin.balance(minerWallet.address), "Afrocoins");
console.log("   Alice:", afrocoin.balance(aliceWallet.address), "Afrocoins");
console.log("   Bob:", afrocoin.balance(bobWallet.address), "Afrocoins");
console.log("");

// Miner sends 10 Afrocoins to Alice
console.log("📤 Miner sends 10 Afrocoins to Alice");
afrocoin.send(minerWallet.address, aliceWallet.address, 10);

// Alice sends 5 Afrocoins to Bob
console.log("📤 Alice sends 5 Afrocoins to Bob");
afrocoin.send(aliceWallet.address, bobWallet.address, 5);

// Mine block to confirm transactions
console.log("⛏️  Mining block to confirm transactions...\n");
afrocoin.mine(minerWallet.address);

// Final balances
console.log("💰 Final Balances:");
console.log("━".repeat(50));
console.log("   Miner:", afrocoin.balance(minerWallet.address), "Afrocoins");
console.log("   Alice:", afrocoin.balance(aliceWallet.address), "Afrocoins");
console.log("   Bob:", afrocoin.balance(bobWallet.address), "Afrocoins");
console.log("");

console.log("📊 Blockchain Stats:");
console.log("━".repeat(50));
console.log("   Total Blocks:", afrocoin.chain.length);
console.log("   Difficulty:", afrocoin.difficulty);
console.log("   Mining Reward:", afrocoin.miningReward, "Afrocoins");
console.log("");

console.log("✅ MILESTONE ACHIEVED!");
console.log("━".repeat(50));
console.log("✓ Real cryptographic wallet addresses (secp256k1)");
console.log("✓ Wallet-based transactions");
console.log("✓ Mining rewards to wallets");
console.log("✓ Balance tracking per wallet");
console.log("");
console.log("⚠️  Current Limitation:");
console.log("   → No transaction signing yet");
console.log("   → Anyone can fake transactions");
console.log("");
console.log("🔜 Next Step: Add transaction signing!");
