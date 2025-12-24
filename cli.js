const Afrocoin = require("./afrocoin");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const afrocoin = new Afrocoin();

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
    console.log("6. Exit");
    console.log("");
}

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createWallet() {
    const wallet = new Wallet();
    const walletName = await prompt("Name this wallet (for easy reference): ");
    userWallets[walletName] = wallet;

    console.log(`\n✅ Wallet "${walletName}" created!`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    console.log(`   ⚠️  SAVE YOUR PRIVATE KEY SECURELY! ⚠️`);
}

async function sendCoins() {
    const fromName = await prompt("From wallet name: ");
    const to = await prompt("To address: ");
    const amount = parseFloat(await prompt("Amount: "));

    if (!userWallets[fromName]) {
        console.log(`❌ Wallet "${fromName}" not found. Create it first.`);
        return;
    }

    const fromWallet = userWallets[fromName];
    const key = ec.keyFromPrivate(fromWallet.privateKey, 'hex');

    try {
        afrocoin.send(fromWallet.address, to, amount, key);
        console.log(`✅ Transaction signed and added: ${fromWallet.address.substring(0, 20)}... → ${to.substring(0, 20)}... (${amount} Afrocoins)`);
    } catch (error) {
        console.log(`❌ Transaction failed: ${error.message}`);
    }
}

async function mineBlock() {
    const miner = await prompt("Miner address: ");
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
                console.log("\n👋 Thanks for using Afrocoin!\n");
                running = false;
                break;
            default:
                console.log("❌ Invalid choice. Please try again.");
        }
    }

    rl.close();
}

main();
