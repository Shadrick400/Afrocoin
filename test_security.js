const axios = require('axios');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const API_URL = 'http://localhost:3001';

async function testSecurity() {
    console.log("🛡️ STARTING SECURITY PENETRATION TEST 🛡️\n");

    // 1. Create a poor wallet (0 balance)
    const key = ec.genKeyPair();
    const poorWallet = key.getPublic('hex');
    const privateKey = key.getPrivate('hex');

    console.log("👤 Attacker Wallet:", poorWallet.substring(0, 30) + "...");
    console.log("");

    // 2. ATTEMPT 1: OVERSPENDING
    console.log("⚔️  ATTEMPT 1: Sending 1000 coins with 0 balance...");
    try {
        await axios.post(`${API_URL}/transact`, {
            fromAddress: poorWallet,
            toAddress: "some-random-recipient",
            amount: 1000,
            privateKey: privateKey
        });
        console.log("❌ FAILED: Network ACCEPTED the transactions! (Bad)");
    } catch (e) {
        console.log("✅ SUCCESS: Network REJECTED transaction:", e.response ? e.response.data.error : e.message);
    }
    console.log("");

    // 3. ATTEMPT 2: NEGATIVE AMOUNT
    console.log("⚔️  ATTEMPT 2: Sending -50 coins (Stealing via math)...");
    try {
        await axios.post(`${API_URL}/transact`, {
            fromAddress: poorWallet,
            toAddress: "some-random-recipient",
            amount: -50,
            privateKey: privateKey
        });
        console.log("❌ FAILED: Network ACCEPTED negative transaction! (Bad)");
    } catch (e) {
        console.log("✅ SUCCESS: Network REJECTED transaction:", e.response ? e.response.data.error : e.message);
    }
}

testSecurity();
