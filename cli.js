const Afrocoin = require("./afrocoin");
const Wallet = require("./wallet");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const fs = require('fs');
const path = require('path');
const DATA_FILE = path.resolve(__dirname, 'user_wallets.json');

const afrocoin = new Afrocoin();
const userWallets = {};

// Load persisted wallets if available
try {
    if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        Object.assign(userWallets, parsed);
    }
} catch (e) {
    console.warn('Warning: failed to load persisted wallets', e.message);
}

// Pre-create a friendly miner name 'sparkcov' for demos if not present
if (!userWallets['sparkcov']) userWallets['sparkcov'] = { address: 'sparkcov', privateKey: null };


console.log("\n═══════════════════════════════════════════════");
console.log("🪙  AFROCOIN INTERACTIVE CLI");
console.log("═══════════════════════════════════════════════\n");

function showMenu() {
    console.log("\nWhat would you like to do?");
    console.log("1. Send Afrocoins");
    console.log("2. Mine a block");
    console.log("3. Check balance");
    console.log("4. View blockchain");
    console.log("5. View pending transactions");
    console.log("6. List saved wallets");
    console.log("7. Exit");
    console.log("");
}

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createWallet() {
    const wallet = new Wallet();
    const walletName = (await prompt("Name this wallet (for easy reference): ")).trim();
    userWallets[walletName] = { address: wallet.address, privateKey: wallet.privateKey };

    // Persist to disk
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(userWallets, null, 2), 'utf8');
    } catch (e) {
        console.warn('Warning: failed to persist wallet', e.message);
    }

    console.log(`\n✅ Wallet "${walletName}" created!`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    console.log(`   ⚠️  SAVE YOUR PRIVATE KEY SECURELY! ⚠️`);
}

async function sendCoins() {
    const fromName = (await prompt("From wallet name: ")).trim();
    const to = (await prompt("To address: ")).trim();
    const amount = parseFloat(await prompt("Amount: "));

    if (!userWallets[fromName]) {
        console.log(`❌ Wallet "${fromName}" not found. Create it first.`);
        return;
    }

    const fromWallet = userWallets[fromName];

    if (!fromWallet.privateKey) {
        console.log(`❌ Wallet "${fromName}" does not have a private key (cannot sign).`);
        return;
    }

    const key = ec.keyFromPrivate(fromWallet.privateKey, 'hex');

    try {
        afrocoin.send(fromWallet.address, to, amount, key);
        console.log(`✅ Transaction signed and added: ${fromWallet.address.substring(0, 20)}... → ${to.substring(0, 20)}... (${amount} Afrocoins)`);
    } catch (error) {
        console.log(`❌ Transaction failed: ${error.message}`);
    }
}

async function mineBlock() {
    let miner = (await prompt("Miner address (press Enter for 'sparkcov'): ")).trim();
    if (!miner) miner = 'sparkcov';
    console.log("\n⛏️  Mining block...");
    afrocoin.mine(miner);
    console.log(`✅ Block mined! ${miner} will receive ${afrocoin.miningReward} Afrocoins`);
}

async function checkBalance() {
    const address = await prompt("Address to check: ");
    const balance = afrocoin.balance(address);
    console.log(`💰 Balance of ${address}: ${balance} Afrocoins`);
}

function viewBlockchain() {
    console.log("\n🔗 BLOCKCHAIN");
    console.log("═══════════════════════════════════════════════");
    afrocoin.chain.forEach((block, index) => {
        console.log(`\nBlock #${index}`);
        console.log(`   Hash: ${block.hash.substring(0, 20)}...`);
        console.log(`   Previous: ${block.previousHash.substring(0, 20)}...`);
        console.log(`   Nonce: ${block.nonce}`);
        console.log(`   Transactions: ${Array.isArray(block.data) ? block.data.length : 0}`);
    });
    console.log("═══════════════════════════════════════════════");
}

function viewPendingTransactions() {
    console.log("\n📝 PENDING TRANSACTIONS");
    console.log("═══════════════════════════════════════════════");
    if (afrocoin.pendingTransactions.length === 0) {
        console.log("   No pending transactions");
    } else {
        afrocoin.pendingTransactions.forEach((tx, index) => {
            console.log(`   ${index + 1}. ${tx.from || 'MINING'} → ${tx.to}: ${tx.amount} Afrocoins`);
        });
    }
    console.log("═══════════════════════════════════════════════");
}

async function listWallets() {
    console.log('\n✅ Saved Wallets:');
    Object.entries(userWallets).forEach(([name, w]) => {
        const truncated = w.address ? `${w.address.substring(0, 12)}...` : 'no-address';
        console.log(`   ${name} — ${truncated} ${w.privateKey ? '(has key)' : '(no key)'} `);
    });
}

async function main() {
    let running = true;

    while (running) {
        showMenu();
        const choice = await prompt("Enter your choice (1-6): ");

        switch (choice.trim()) {
            case "1":
                await sendCoins();
                break;
            case "2":
                await mineBlock();
                break;
            case "3":
                await checkBalance();
                break;
            case "4":
                viewBlockchain();
                break;
            case "5":
                viewPendingTransactions();
                break;
            case "6":
                await listWallets();
                break;
            case "7":
                console.log("\n👋 Thanks for using Afrocoin!\n");
                running = false;
                break;
            default:
                console.log("❌ Invalid choice. Please try again.");
        }
    }

    // Persist before exit
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(userWallets, null, 2), 'utf8');
    } catch (e) {
        console.warn('Warning: failed to persist wallets on exit', e.message);
    }

    rl.close();
}

main();
