const Afrocoin = require('./afrocoin');
const Wallet = require('./wallet');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

console.log('🚀 AFROCOIN SMART CONTRACT DEMO');
console.log('==============================\n');

// Initialize blockchain
const afrocoin = new Afrocoin();

// Create wallets
const owner = new Wallet();
const user1 = new Wallet();
const user2 = new Wallet();

console.log('👛 Wallets Created:');
console.log('Owner:', owner.address.substring(0, 20) + '...');
console.log('User1:', user1.address.substring(0, 20) + '...');
console.log('User2:', user2.address.substring(0, 20) + '...');
console.log();

// Mine initial coins
console.log('⛏️  Mining initial coins...');
afrocoin.mine(owner.address);
console.log('✅ Owner balance:', afrocoin.balance(owner.address), 'Afrocoins\n');

// Simple Token Contract
const tokenContractCode = `
    function initialize(initialSupply, tokenName, tokenSymbol) {
        state.totalSupply = initialSupply;
        state.balances = {};
        state.balances[params.owner] = initialSupply;
        state.name = tokenName;
        state.symbol = tokenSymbol;
        return 'Token initialized: ' + tokenName + ' (' + tokenSymbol + ')';
    }

    function transfer(to, amount) {
        require(state.balances[caller] >= amount, 'Insufficient balance');
        require(amount > 0, 'Amount must be positive');

        state.balances[caller] -= amount;
        if (!state.balances[to]) state.balances[to] = 0;
        state.balances[to] += amount;

        return 'Transferred ' + amount + ' ' + state.symbol + ' to ' + to.substring(0, 10) + '...';
    }

    function balanceOf(address) {
        return state.balances[address] || 0;
    }

    function getTotalSupply() {
        return state.totalSupply;
    }
`;

// Deploy the token contract
console.log('📄 Deploying Token Contract...');
const contractAddress = afrocoin.deployContract(tokenContractCode, owner.address, {});
console.log('✅ Contract deployed at:', contractAddress.substring(0, 20) + '...\n');

// Initialize the token
console.log('🔄 Initializing Token (1000 AFRO tokens)...');
const initResult = afrocoin.callContract(contractAddress, 'initialize',
    { owner: owner.address }, owner.address);
console.log('✅', initResult.result);
console.log('📊 Total supply:', afrocoin.callContract(contractAddress, 'getTotalSupply', {}, owner.address).result);
console.log('💰 Owner balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: owner.address }, owner.address).result, 'AFRO\n');

// Transfer tokens
console.log('💸 Transferring 100 AFRO tokens to User1...');
const transferResult = afrocoin.callContract(contractAddress, 'transfer',
    { to: user1.address, amount: 100 }, owner.address);
console.log('✅', transferResult.result);
console.log('💰 Owner balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: owner.address }, owner.address).result, 'AFRO');
console.log('💰 User1 balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: user1.address }, owner.address).result, 'AFRO\n');

// User1 transfers to User2
console.log('💸 User1 transferring 50 AFRO tokens to User2...');
const transfer2Result = afrocoin.callContract(contractAddress, 'transfer',
    { to: user2.address, amount: 50 }, user1.address);
console.log('✅', transfer2Result.result);
console.log('💰 User1 balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: user1.address }, owner.address).result, 'AFRO');
console.log('💰 User2 balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: user2.address }, owner.address).result, 'AFRO\n');

// Demonstrate contract state persistence
console.log('🔍 Contract State:');
const contract = afrocoin.getContract(contractAddress);
console.log(JSON.stringify(contract.state, null, 2));
console.log();

// Demonstrate transaction-based contract calls
console.log('📝 Creating contract call transaction...');
const ownerKey = ec.keyFromPrivate(owner.privateKey, 'hex');
afrocoin.callContractTransaction(owner.address, contractAddress, 'transfer',
    { to: user2.address, amount: 25 }, ownerKey);

// Mine to execute the contract call
console.log('⛏️  Mining to execute contract call...');
afrocoin.mine(owner.address);
console.log('✅ Contract call executed via transaction');
console.log('💰 User2 final balance:', afrocoin.callContract(contractAddress, 'balanceOf', { address: user2.address }, owner.address).result, 'AFRO\n');

// Show all contracts
console.log('📋 All Deployed Contracts:');
const allContracts = afrocoin.getAllContracts();
allContracts.forEach((contract, index) => {
    console.log(`${index + 1}. ${contract.address.substring(0, 20)}... (${contract.transactionCount} calls)`);
});

console.log('\n🎉 SMART CONTRACT DEMO COMPLETE!');
console.log('==============================');
console.log('✓ Contract deployment');
console.log('✓ Contract method calls');
console.log('✓ State persistence');
console.log('✓ Transaction-based calls');
console.log('✓ Balance tracking');
