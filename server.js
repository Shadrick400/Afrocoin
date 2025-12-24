const express = require("express");
const bodyParser = require("body-parser");
const Afrocoin = require("./afrocoin");
const P2pServer = require("./p2p_server");
const Transaction = require("./transaction");
const Wallet = require("./wallet"); // Helper for generating keys if needed

// CONFIGURATION
const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 5001;
const PEERS = process.env.PEERS ? process.env.PEERS.split(",") : [];

// INITIALIZATION
const myCoin = new Afrocoin();
const p2pServer = new P2pServer(myCoin);
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

// --- ROUTES ---

// 0. Generate new wallet (Convenience)
app.get("/wallet/new", (req, res) => {
    const EC = require('elliptic').ec;
    const ec = new EC('secp256k1');
    const key = ec.genKeyPair();
    res.json({
        publicKey: key.getPublic('hex'),
        privateKey: key.getPrivate('hex')
    });
});

// 1. Get entire blockchain
app.get("/blocks", (req, res) => {
    res.json(myCoin.chain);
});

// 2. Get pending transactions
app.get("/transactions", (req, res) => {
    res.json(myCoin.pendingTransactions);
});

// 3. Create and broadcast a transaction
app.post("/transact", (req, res) => {
    const { fromAddress, toAddress, amount, privateKey } = req.body;

    if (!fromAddress || !toAddress || !amount || !privateKey) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const tx = new Transaction(fromAddress, toAddress, Number(amount));

        // Re-create key from private key string to sign
        const EC = require('elliptic').ec;
        const ec = new EC('secp256k1');
        const key = ec.keyFromPrivate(privateKey);

        tx.signTransaction(key);

        myCoin.addTransaction(tx);
        p2pServer.broadcastTransaction(tx); // Sync with peers

        res.json({ message: "Transaction added and broadcasted", transaction: tx });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// 4. Mine a block
app.post("/mine", (req, res) => {
    const { minerAddress } = req.body;

    if (!minerAddress) {
        return res.status(400).json({ error: "minerAddress is required" });
    }

    myCoin.minePendingTransactions(minerAddress);
    p2pServer.syncChains(); // Tell peers we have a new block

    res.json({
        message: "Block mined successfully",
        block: myCoin.getLatestBlock()
    });
});

// 5. Check balance
app.get("/balance/:address", (req, res) => {
    const balance = myCoin.balance(req.params.address);
    res.json({ address: req.params.address, balance });
});

// --- SERVER START ---

// Start P2P Server
p2pServer.listen(P2P_PORT);
p2pServer.connectToPeers(PEERS);

// Start HTTP Server
app.listen(HTTP_PORT, () => {
    console.log(`\n🌍 API Server running on: http://localhost:${HTTP_PORT}`);
    console.log(`   GET /blocks`);
    console.log(`   GET /balance/:address`);
    console.log(`   POST /transact`);
    console.log(`   POST /mine`);
    console.log(`\n📡 P2P Server running on port: ${P2P_PORT}`);
});
