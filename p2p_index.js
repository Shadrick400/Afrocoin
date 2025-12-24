const Afrocoin = require("./afrocoin");
const P2pServer = require("./p2p_server");
const Wallet = require("./wallet"); // For demo identity

const p2pPort = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

const myCoin = new Afrocoin();
const p2pServer = new P2pServer(myCoin);

console.log(`🚀 Starting Afrocoin Node on port ${p2pPort}...`);

p2pServer.listen(p2pPort);
p2pServer.connectToPeers(peers);

// DEMO LOGIC: Mine a block every 10 seconds to generate activity
const myWallet = new Wallet(); // Random identity for this node
console.log(`👤 Miner Identity: ${myWallet.address.substring(0, 20)}...`);

setInterval(() => {
    // Only mine if we have transactions or just to generate blocks?
    // Let's mine empty blocks just to grow the chain and test sync
    console.log(`\n⛏️  Node ${p2pPort} is mining a block...`);
    myCoin.minePendingTransactions(myWallet.address);
    p2pServer.syncChains();

    console.log(`⛓️  Chain length: ${myCoin.chain.length}`);
}, 15000 + Math.random() * 10000); // Random interval 15-25s

// Keep process alive
process.stdin.resume();
