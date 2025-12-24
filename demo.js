const Afrocoin = require("./afrocoin");
const Wallet = require("./wallet");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

console.log("═══════════════════════════════════════════════");
console.log("🪙  AFROCOIN BLOCKCHAIN DEMO");
console.log("═══════════════════════════════════════════════\n");

// Initialize blockchain
const afrocoin = new Afrocoin();
console.log("✅ Blockchain initialized");
console.log(`   Mining difficulty: ${afrocoin.difficulty}`);
console.log(`   Mining reward: ${afrocoin.miningReward} Afrocoins\n`);

// Create wallets for demo
const aliceWallet = new Wallet();
const bobWallet = new Wallet();
const charlieWallet = new Wallet();
const miner1Wallet = new Wallet();
const miner2Wallet = new Wallet();

// Create signing keys
const aliceKey = ec.keyFromPrivate(aliceWallet.privateKey, 'hex');
const bobKey = ec.keyFromPrivate(bobWallet.privateKey, 'hex');
const charlieKey = ec.keyFromPrivate(charlieWallet.privateKey, 'hex');
const miner1Key = ec.keyFromPrivate(miner1Wallet.privateKey, 'hex');
const miner2Key = ec.keyFromPrivate(miner2Wallet.privateKey, 'hex');

// Use friendly miner names
const MINER_PRIMARY = 'sparkcov';
const MINER_SECONDARY = 'sparkcov2';

console.log("👛 Demo wallets created with cryptographic addresses\n");

// Scenario 1: Alice sends to Bob
console.log("📝 Transaction 1: Alice → Bob (10 Afrocoins)");
afrocoin.send(aliceWallet.address, bobWallet.address, 10, aliceKey);

console.log("📝 Transaction 2: Alice → Charlie (5 Afrocoins)");
afrocoin.send(aliceWallet.address, charlieWallet.address, 5, aliceKey);

console.log("\n⛏️  Mining block 1 for Miner1 (sparkcov)...");
afrocoin.mine(MINER_PRIMARY);

// Scenario 2: Bob sends to Charlie
console.log("\n📝 Transaction 3: Bob → Charlie (3 Afrocoins)");
afrocoin.send(bobWallet.address, charlieWallet.address, 3, bobKey);

console.log("\n⛏️  Mining block 2 for Miner2 (sparkcov2)...");
afrocoin.mine(MINER_SECONDARY);

// Scenario 3: More transactions
console.log("\n📝 Transaction 4: Charlie → Alice (2 Afrocoins)");
afrocoin.send(charlieWallet.address, aliceWallet.address, 2, charlieKey);

console.log("\n⛏️  Mining block 3 for Miner1 (sparkcov)...");
afrocoin.mine(MINER_PRIMARY);

// Display final balances
console.log("\n═══════════════════════════════════════════════");
console.log("💰 FINAL BALANCES");
console.log("═══════════════════════════════════════════════");
console.log(`   Alice:    ${afrocoin.balance("alice").toString().padStart(3)} Afrocoins`);
console.log(`   Bob:      ${afrocoin.balance("bob").toString().padStart(3)} Afrocoins`);
console.log(`   Charlie:  ${afrocoin.balance("charlie").toString().padStart(3)} Afrocoins`);
console.log(`   Miner1:   ${afrocoin.balance("miner1").toString().padStart(3)} Afrocoins`);
console.log(`   Miner2:   ${afrocoin.balance("miner2").toString().padStart(3)} Afrocoins`);

// Display blockchain stats
console.log("\n═══════════════════════════════════════════════");
console.log("📊 BLOCKCHAIN STATISTICS");
console.log("═══════════════════════════════════════════════");
console.log(`   Total blocks: ${afrocoin.chain.length}`);
console.log(`   Pending transactions: ${afrocoin.pendingTransactions.length}`);

// Display block details
console.log("\n═══════════════════════════════════════════════");
console.log("🔗 BLOCKCHAIN DETAILS");
console.log("═══════════════════════════════════════════════");
afrocoin.chain.forEach((block, index) => {
    console.log(`\nBlock #${index}`);
    console.log(`   Hash: ${block.hash}`);
    console.log(`   Previous Hash: ${block.previousHash}`);
    console.log(`   Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
    console.log(`   Nonce: ${block.nonce}`);
    console.log(`   Transactions: ${Array.isArray(block.data) ? block.data.length : 0}`);
    if (Array.isArray(block.data) && block.data.length > 0) {
        block.data.forEach((tx, txIndex) => {
            console.log(`      ${txIndex + 1}. ${tx.from || 'MINING'} → ${tx.to}: ${tx.amount} Afrocoins`);
        });
    }
});

console.log("\n═══════════════════════════════════════════════");
console.log("✅ AFROCOIN BLOCKCHAIN DEMO COMPLETE!");
console.log("═══════════════════════════════════════════════\n");
