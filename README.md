# 🪙 Afrocoin - A Simple Blockchain Implementation

A basic blockchain implementation with Proof-of-Work mining, wallet addresses, and transaction capabilities.

## ✨ Features

✅ **Afrocoin blockchain** - Complete blockchain data structure  
✅ **Mining rewards** - Earn 25 Afrocoins per mined block  
✅ **Wallet addresses** - Simple string-based addresses  
✅ **Send Afrocoin** - Transfer coins between addresses  
✅ **View balances** - Check balance for any address  
✅ **Proof-of-Work** - Real mining with adjustable difficulty  

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- VS Code (recommended)

### Installation

```bash
# Install dependencies
npm install
```

### Running Afrocoin

```bash
# Run the basic demo
node index.js

# Run the enhanced demo with multiple transactions
node demo.js

# Run the interactive CLI
node cli.js
```

## 📁 Project Structure

```
afrocoin/
├── block.js       # Block class with PoW mining
├── afrocoin.js    # Blockchain implementation
├── index.js       # Basic demo
├── demo.js        # Enhanced demo with multiple scenarios
├── cli.js         # Interactive command-line interface
└── package.json   # Project dependencies
```

## 🔧 How It Works

### Block Structure
Each block contains:
- `timestamp` - When the block was created
- `data` - Array of transactions
- `previousHash` - Hash of the previous block
- `hash` - Current block's hash
- `nonce` - Number used for mining

### Mining (Proof-of-Work)
Blocks must be mined by finding a hash that starts with a certain number of zeros (difficulty level). The miner receives a reward for successfully mining a block.

### Transactions
Transactions are simple objects with:
- `from` - Sender address (null for mining rewards)
- `to` - Recipient address
- `amount` - Number of Afrocoins

## 💡 Usage Example

```javascript
const Afrocoin = require("./afrocoin");

// Create new blockchain
const afrocoin = new Afrocoin();

// Create a transaction
afrocoin.send("alice", "bob", 10);

// Mine the pending transactions
afrocoin.mine("miner1");

// Check balances
console.log("Miner balance:", afrocoin.balance("miner1"));
console.log("Bob balance:", afrocoin.balance("bob"));
```

## ⚙️ Configuration

You can adjust these parameters in `afrocoin.js`:
- `difficulty` - Mining difficulty (default: 3)
- `miningReward` - Coins rewarded per block (default: 25)

## 🎯 Next Steps

This is a basic implementation for learning purposes. To make it production-ready, you would need to add:
- Transaction validation
- Digital signatures
- Peer-to-peer networking
- Consensus mechanisms
- Wallet management
- Transaction fees

## 📝 License

MIT - Feel free to use this for learning!

---

**Built with ❤️ for learning blockchain technology**
# Afrocoin
