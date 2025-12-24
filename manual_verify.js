const Afrocoin = require('./afrocoin');
const Transaction = require('./transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

console.log("🔍 STARTING MANUAL SECURITY VERIFICATION 🔍\n");

const myCoin = new Afrocoin();

// --- 1. SETUP IDENTITIES ---
const key1 = ec.genKeyPair();
const wallet1 = key1.getPublic('hex');

const key2 = ec.genKeyPair();
const wallet2 = key2.getPublic('hex');

console.log("👤 User 1 (Miner):", wallet1.substring(0, 30) + "...");
console.log("👤 User 2 (Receiver):", wallet2.substring(0, 30) + "...");
console.log("");

// --- 2. MINE INITIAL COINS ---
console.log("⛏️  Mining Block 1 (Get initial coins for User 1)...");
myCoin.minePendingTransactions(wallet1);
console.log("💰 Balance User 1:", myCoin.balance(wallet1));
console.log("");

// --- 3. CREATE & SIGN VALID TRANSACTION ---
console.log("✅ TEST 1: Valid Signed Transaction (10 Coins)");
const tx1 = new Transaction(wallet1, wallet2, 10);
tx1.signTransaction(key1);
console.log("   Signature:", tx1.signature.substring(0, 30) + "...");

try {
    myCoin.addTransaction(tx1);
    console.log("   Result: ACCEPTED (Added to pending)");
} catch (e) {
    console.log("   Result: FAILED", e.message);
}
console.log("");

// --- 4. CREATE INVALID TRANSACTION (No Signature) ---
console.log("❌ TEST 2: Unsigned Transaction (Attempting to steal 5 Coins)");
const tx2 = new Transaction(wallet1, wallet2, 5);
// We purposely DO NOT sign this transaction, or sign it with wrong key
// tx2.signTransaction(key1); <--- MISSING

try {
    myCoin.addTransaction(tx2);
    console.log("   Result: ACCEPTED (This should not happen!)");
} catch (e) {
    console.log("   Result: REJECTED! Error:", e.message);
}
console.log("");

// --- 5. CREATE FAKE TRANSACTION (Wrong Key) ---
console.log("❌ TEST 3: Fake Signature (User 2 tries to spend User 1's money)");
const tx3 = new Transaction(wallet1, wallet2, 100);
try {
    // User 2 tries to sign a transaction FROM User 1
    tx3.signTransaction(key2); // WRONG KEY
} catch (e) {
    console.log("   Result: BLOCKED AT SIGNING!", e.message);
}
console.log("");

// --- 6. PROCESS & CHECK BALANCES ---
console.log("⛏️  Mining Block 2 (Process pending transactions)...");
myCoin.minePendingTransactions(wallet1);

console.log("\n📊 FINAL ACCOUNTING:");
console.log("   User 1 Balance:", myCoin.balance(wallet1)); // 25 (Block 1) + 25 (Block 2) - 10 (Sent) = 40
console.log("   User 2 Balance:", myCoin.balance(wallet2)); // 10 (Received)

console.log("\n✨ SECURITY AUDIT COMPLETE.");
