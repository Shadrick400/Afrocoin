const Afrocoin = require('./afrocoin');
const Transaction = require('./transaction');
const SmartContract = require('./smart_contract');
const ERC20Token = require('./token_standard');
const HDWallet = require('./hd_wallet');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

console.log('🧪 COMPREHENSIVE AFROCOIN TEST SUITE\n');

class TestSuite {
    constructor() {
        this.afrocoin = new Afrocoin();
        this.results = { passed: 0, failed: 0, tests: [] };
    }

    log(message) {
        console.log(message);
    }

    assert(condition, message) {
        if (condition) {
            this.results.passed++;
            this.log(`✅ ${message}`);
        } else {
            this.results.failed++;
            this.log(`❌ ${message}`);
        }
        this.results.tests.push({ message, passed: condition });
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive Test Suite...\n');

        try {
            await this.testBasicBlockchain();
            await this.testTransactionSigning();
            await this.testMultiSignature();
            await this.testSmartContracts();
            await this.testTokenStandard();
            await this.testHDWallets();
            await this.testMiningAndRewards();
            await this.testChainValidation();
        } catch (error) {
            this.log(`💥 Test suite crashed: ${error.message}`);
            this.results.failed++;
        }

        this.printSummary();
    }

    async testBasicBlockchain() {
        this.log('📋 Testing Basic Blockchain Functionality');

        // Test genesis block
        this.assert(this.afrocoin.chain.length === 1, 'Genesis block created');
        this.assert(this.afrocoin.chain[0].transactions.length === 0, 'Genesis block has no transactions');

        // Test block mining
        const initialLength = this.afrocoin.chain.length;
        this.afrocoin.minePendingTransactions('miner1');
        this.assert(this.afrocoin.chain.length === initialLength + 1, 'Block mined successfully');

        // Test balance tracking
        const minerBalance = this.afrocoin.balance('miner1');
        this.assert(minerBalance === 25, `Miner received 25 Afrocoins (got ${minerBalance})`);

        this.log('');
    }

    async testTransactionSigning() {
        this.log('🔐 Testing Transaction Signing & Verification');

        // Create test wallets
        const wallet1 = ec.genKeyPair();
        const wallet2 = ec.genKeyPair();
        const addr1 = wallet1.getPublic('hex');
        const addr2 = wallet2.getPublic('hex');

        // Mine some coins for wallet1
        this.afrocoin.minePendingTransactions(addr1);

        // Test valid signed transaction
        const tx1 = new Transaction(addr1, addr2, 5);
        tx1.signTransaction(wallet1);
        this.assert(tx1.isValid(), 'Valid signed transaction passes verification');

        // Add transaction and mine
        this.afrocoin.addTransaction(tx1);
        this.afrocoin.minePendingTransactions(addr1);

        // Check balances
        const balance1 = this.afrocoin.balance(addr1);
        const balance2 = this.afrocoin.balance(addr2);
        this.assert(balance2 === 5, `Recipient received 5 Afrocoins (got ${balance2})`);

        // Test invalid signature
        const tx2 = new Transaction(addr1, addr2, 5);
        tx2.signTransaction(wallet2); // Wrong key
        this.assert(!tx2.isValid(), 'Invalid signature correctly rejected');

        // Test tampering
        const tx3 = new Transaction(addr1, addr2, 3);
        tx3.signTransaction(wallet1);
        tx3.amount = 10; // Tamper
        this.assert(!tx3.isValid(), 'Tampered transaction correctly rejected');

        this.log('');
    }

    async testMultiSignature() {
        this.log('🔑 Testing Multi-Signature Transactions');

        // Create 3 signers
        const signer1 = ec.genKeyPair();
        const signer2 = ec.genKeyPair();
        const signer3 = ec.genKeyPair();

        const signers = [signer1, signer2, signer3];
        const publicKeys = signers.map(s => s.getPublic('hex'));

        // Create 2-of-3 multi-sig transaction
        const multiTx = new Transaction(null, 'recipient', 10);
        multiTx.setupMultiSig(publicKeys, 2); // 2 of 3 required

        // Generate multi-sig address
        const multiSigAddress = multiTx.generateMultiSigAddress();
        this.assert(multiSigAddress.length > 0, 'Multi-sig address generated');

        // Add signatures
        multiTx.addSignature(signer1);
        multiTx.addSignature(signer2);

        // Should be valid with 2 signatures
        this.assert(multiTx.isValid(), 'Multi-sig transaction valid with required signatures');

        // Test insufficient signatures
        const multiTx2 = new Transaction(null, 'recipient', 5);
        multiTx2.setupMultiSig(publicKeys, 2);
        multiTx2.addSignature(signer1); // Only 1 signature
        this.assert(!multiTx2.isValid(), 'Multi-sig transaction invalid with insufficient signatures');

        this.log('');
    }

    async testSmartContracts() {
        this.log('📄 Testing Smart Contracts');

        // Create a simple token contract
        const tokenCode = `
            let balances = {};
            let totalSupply = 1000;

            function constructor(owner) {
                balances[owner] = totalSupply;
            }

            function balanceOf(address) {
                return balances[address] || 0;
            }

            function transfer(from, to, amount) {
                if (balances[from] >= amount) {
                    balances[from] -= amount;
                    balances[to] = (balances[to] || 0) + amount;
                    return true;
                }
                return false;
            }

            function mint(to, amount) {
                balances[to] = (balances[to] || 0) + amount;
                totalSupply += amount;
                return true;
            }
        `;

        const contract = new SmartContract(tokenCode, 'owner123');
        const contractAddress = this.afrocoin.deployContract(contract);

        this.assert(contractAddress.length > 0, 'Smart contract deployed');

        // Test contract execution
        const result1 = this.afrocoin.callContract(contractAddress, 'balanceOf', ['owner123']);
        this.assert(result1.result === 1000, 'Contract constructor executed correctly');

        // Test transfer
        const result2 = this.afrocoin.callContract(contractAddress, 'transfer', ['owner123', 'user456', 100]);
        this.assert(result2.result === true, 'Token transfer executed successfully');

        const balance1 = this.afrocoin.callContract(contractAddress, 'balanceOf', ['owner123']);
        const balance2 = this.afrocoin.callContract(contractAddress, 'balanceOf', ['user456']);
        this.assert(balance1.result === 900 && balance2.result === 100, 'Token balances updated correctly');

        this.log('');
    }

    async testTokenStandard() {
        this.log('🪙 Testing Token Standard (ERC-20)');

        const token = new ERC20Token('TestToken', 'TST', 18, 1000000);
        const deployer = 'deployer123';

        // Deploy token
        const tokenAddress = this.afrocoin.deployToken(token, deployer);
        this.assert(tokenAddress.length > 0, 'Token deployed successfully');

        // Check initial supply
        const totalSupply = this.afrocoin.callToken(tokenAddress, 'totalSupply');
        this.assert(totalSupply === 1000000, 'Initial supply correct');

        // Check deployer balance
        const deployerBalance = this.afrocoin.callToken(tokenAddress, 'balanceOf', [deployer]);
        this.assert(deployerBalance === 1000000, 'Deployer has all tokens');

        // Test transfer
        const recipient = 'recipient456';
        const transferResult = this.afrocoin.callToken(tokenAddress, 'transfer', [deployer, recipient, 1000]);
        this.assert(transferResult, 'Token transfer successful');

        const newDeployerBalance = this.afrocoin.callToken(tokenAddress, 'balanceOf', [deployer]);
        const recipientBalance = this.afrocoin.callToken(tokenAddress, 'balanceOf', [recipient]);
        this.assert(newDeployerBalance === 999000 && recipientBalance === 1000, 'Token balances updated after transfer');

        this.log('');
    }

    async testHDWallets() {
        this.log('📱 Testing HD Wallets');

        // Create HD wallet
        const hdWallet = new HDWallet();

        // Generate addresses
        const address0 = hdWallet.getAddress(0, 0, 0);
        const address1 = hdWallet.getAddress(0, 0, 1);

        this.assert(address0.address.length > 0, 'HD wallet address generated');
        this.assert(address1.address.length > 0, 'Multiple addresses generated');
        this.assert(address0.address !== address1.address, 'Addresses are unique');

        // Test seed phrase
        const seedPhrase = HDWallet.generateSeedPhrase();
        this.assert(seedPhrase.split(' ').length === 12, '12-word seed phrase generated');

        const walletFromSeed = HDWallet.fromSeedPhrase(seedPhrase);
        this.assert(walletFromSeed.masterSeed.length > 0, 'Wallet created from seed phrase');

        // Test address batch generation
        const addresses = hdWallet.getReceivingAddresses(5);
        this.assert(addresses.length === 5, 'Batch address generation works');

        this.log('');
    }

    async testMiningAndRewards() {
        this.log('⛏️ Testing Mining & Rewards');

        const miner = 'miner456';
        const initialBalance = this.afrocoin.balance(miner);

        // Mine a block
        this.afrocoin.minePendingTransactions(miner);
        const newBalance = this.afrocoin.balance(miner);

        this.assert(newBalance === initialBalance + 25, 'Miner received correct reward');

        // Test transaction fees
        const sender = ec.genKeyPair();
        const receiver = ec.genKeyPair();
        const senderAddr = sender.getPublic('hex');
        const receiverAddr = receiver.getPublic('hex');

        // Give sender some coins
        this.afrocoin.minePendingTransactions(senderAddr);

        // Create transaction with fee
        const feeTx = new Transaction(senderAddr, receiverAddr, 10, 1); // 1 Afrocoin fee
        feeTx.signTransaction(sender);
        this.afrocoin.addTransaction(feeTx);

        // Mine block (miner should get the fee)
        const minerBalanceBefore = this.afrocoin.balance(miner);
        this.afrocoin.minePendingTransactions(miner);
        const minerBalanceAfter = this.afrocoin.balance(miner);

        this.assert(minerBalanceAfter === minerBalanceBefore + 26, 'Miner received block reward + transaction fee');

        this.log('');
    }

    async testChainValidation() {
        this.log('🔗 Testing Chain Validation');

        // Test valid chain
        this.assert(this.afrocoin.isChainValid(), 'Initial chain is valid');

        // Test tampering detection
        const originalHash = this.afrocoin.chain[1].hash;
        this.afrocoin.chain[1].transactions[0].amount = 99999;

        this.assert(!this.afrocoin.isChainValid(), 'Tampered chain correctly detected as invalid');

        // Restore
        this.afrocoin.chain[1].transactions[0].amount = 25;
        this.afrocoin.chain[1].hash = originalHash;

        this.assert(this.afrocoin.isChainValid(), 'Chain valid after restoration');

        this.log('');
    }

    printSummary() {
        this.log('📊 TEST SUITE SUMMARY');
        this.log('='.repeat(50));
        this.log(`Total Tests: ${this.results.tests.length}`);
        this.log(`✅ Passed: ${this.results.passed}`);
        this.log(`❌ Failed: ${this.results.failed}`);
        this.log(`Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            this.log('\n🎉 ALL TESTS PASSED! Afrocoin is fully functional.');
        } else {
            this.log('\n⚠️ Some tests failed. Check implementation.');
        }
    }
}

// Run the test suite
const testSuite = new TestSuite();
testSuite.runAllTests().catch(console.error);
