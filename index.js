const Afrocoin = require('./afrocoin');
const Transaction = require('./transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Initialize Blockchain
const myCoin = new Afrocoin();

// --- SETUP WALLETS ---
// 1. Create Key and Wallet for User 1
const key1 = ec.genKeyPair();
const wallet1 = key1.getPublic('hex');

// 2. Create Key and Wallet for User 2
const key2 = ec.genKeyPair();
const wallet2 = key2.getPublic('hex');

console.log('Wallet 1:', wallet1);
console.log('Wallet 2:', wallet2);
console.log('');

// --- MINING FIRST ---
// Miner (Wallet 1) needs coins to spend
console.log('⛏️  Wallet 1 mining to get coins...');
myCoin.minePendingTransactions(wallet1);

console.log('💰 Balance of Wallet 1:', myCoin.balance(wallet1));
console.log('');

// --- REAL TRANSACTION ---
// Create tx: Wallet 1 -> Wallet 2 (10 coins)
const tx1 = new Transaction(wallet1, wallet2, 10);

// SIGN the transaction with Wallet 1's PRIVATE KEY
console.log('✍️  Signing transaction...');
tx1.signTransaction(key1);

// Add to blockchain
console.log('📥 Adding transaction to chain...');
try {
    myCoin.addTransaction(tx1);
} catch (e) {
    console.log('Error:', e);
}

// Mine to process transaction
console.log('\n⛏️  Mining block to process transaction...');
myCoin.minePendingTransactions(wallet1);

// --- FINAL BALANCES ---
console.log('\n💰 Final Balances:');
console.log('Wallet 1:', myCoin.balance(wallet1));
console.log('Wallet 2:', myCoin.balance(wallet2));

// --- TAMPERING ATTEMPT ---
console.log('\n😈 Attempting to modify transaction in chain...');
myCoin.chain[1].transactions[0].amount = 100; // Trying to steal more!
console.log('Is chain valid?', myCoin.isChainValid() ? '✅ Yes' : '❌ No! Tampering detected!');
