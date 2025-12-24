const WebSocket = require("ws");

// Message Types
const MESSAGE_TYPES = {
    CHAIN: "CHAIN",
    TRANSACTION: "TRANSACTION",
    CLEAR_TRANSACTIONS: "CLEAR_TRANSACTIONS"
};

class P2pServer {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    // Start the server
    listen(p2pPort) {
        const server = new WebSocket.Server({ port: p2pPort });
        server.on("connection", (socket) => this.connectSocket(socket));
        console.log(`📡 P2P Server listening on port: ${p2pPort}`);
    }

    // Connect to peers specified in command line
    connectToPeers(peers) {
        peers.forEach((peer) => {
            const socket = new WebSocket(peer);
            socket.on("open", () => this.connectSocket(socket));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log("🤝 Socket connected");
        this.messageHandler(socket);

        // As soon as we connect, send our chain
        this.sendChain(socket);
    }

    messageHandler(socket) {
        socket.on("message", (message) => {
            const data = JSON.parse(message);

            switch (data.type) {
                case MESSAGE_TYPES.CHAIN:
                    this.handleChainSync(data.chain);
                    break;
                case MESSAGE_TYPES.TRANSACTION:
                    this.handleTransaction(data.transaction);
                    break;
            }
        });
    }

    handleTransaction(transaction) {
        // We need to turn the plain JSON object back into a Transaction instance
        // to verify signature, or at least pass it to addTransaction which checks validity

        // Ideally we reconstruct:
        // const txObj = new Transaction(transaction.fromAddress, transaction.toAddress, transaction.amount);
        // txObj.signature = transaction.signature;
        // txObj.timestamp = transaction.timestamp;

        // But since addTransaction takes an object and checks .isValid(), we need to attach the .isValid method to this data.
        // The easiest way is to use the existing validation or reconstruct.

        // Let's rely on Afrocoin's addTransaction, but we first need to cast it to Transaction class
        // because addTransaction calls .isValid() which is a class method.

        const Transaction = require("./transaction");
        const txObj = new Transaction(transaction.fromAddress, transaction.toAddress, transaction.amount);
        txObj.timestamp = transaction.timestamp;
        txObj.signature = transaction.signature;

        try {
            this.blockchain.addTransaction(txObj);
            console.log("📥 Received new transaction via P2P");
        } catch (e) {
            console.log("❌ Received invalid transaction:", e.message);
        }
    }
    handleChainSync(incomingChain) {
        // We only care if the incoming chain is longer than ours
        if (incomingChain.length > this.blockchain.chain.length) {
            console.log("📥 Received longer chain. Replacing current chain...");
            try {
                this.blockchain.replaceChain(incomingChain);
                console.log("✅ Chain replaced successfully!");
            } catch (e) {
                console.log("❌ Received chain was invalid:", e.message);
            }
        } else {
            console.log("📥 Received chain is not longer. Ignoring.");
        }
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.CHAIN,
            chain: this.blockchain.chain
        }));
    }

    syncChains() {
        this.sockets.forEach((socket) => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: MESSAGE_TYPES.TRANSACTION,
                transaction: transaction
            }));
        });
    }
}

module.exports = P2pServer;
