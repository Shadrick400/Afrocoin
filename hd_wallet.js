const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');
const crypto = require('crypto');

class HDWallet {
    constructor(masterSeed = null) {
        if (masterSeed) {
            this.masterSeed = masterSeed;
        } else {
            // Generate random 256-bit seed
            this.masterSeed = crypto.randomBytes(32).toString('hex');
        }

        // Derive master private key from seed
        this.masterPrivateKey = this.deriveMasterKey(this.masterSeed);
        this.masterPublicKey = ec.keyFromPrivate(this.masterPrivateKey).getPublic('hex');

        // BIP32 path constants
        this.purpose = 44; // BIP44 purpose for cryptocurrency
        this.coinType = 0; // 0 for Bitcoin, we'll use a custom value for Afrocoin
        this.account = 0; // Default account
    }

    // Derive master key using HMAC-SHA512 (simplified BIP32)
    deriveMasterKey(seed) {
        const hmac = crypto.createHmac('sha512', 'Bitcoin seed');
        const I = hmac.update(Buffer.from(seed, 'hex')).digest();

        // Left 32 bytes = master private key
        return I.slice(0, 32).toString('hex');
    }

    // Derive child key using CKD (Child Key Derivation)
    deriveChildKey(parentPrivateKey, index, hardened = false) {
        const parentKey = ec.keyFromPrivate(parentPrivateKey);
        const parentPublicKey = parentKey.getPublic();

        let data;
        if (hardened) {
            // Hardened derivation: use parent private key
            const privateKeyBytes = Buffer.from(parentPrivateKey, 'hex');
            const indexBytes = Buffer.alloc(4);
            indexBytes.writeUInt32BE(index + 0x80000000, 0); // Add 2^31 for hardened
            data = Buffer.concat([Buffer.alloc(1, 0), privateKeyBytes, indexBytes]);
        } else {
            // Normal derivation: use parent public key
            const publicKeyBytes = Buffer.from(parentPublicKey.encodeCompressed());
            const indexBytes = Buffer.alloc(4);
            indexBytes.writeUInt32BE(index, 0);
            data = Buffer.concat([publicKeyBytes, indexBytes]);
        }

        // HMAC-SHA512 with parent chain code (simplified - using parent private key hash)
        const hmac = crypto.createHmac('sha512', SHA256(parentPrivateKey).toString());
        const I = hmac.update(data).digest();

        // Left 32 bytes = child private key
        const modN = BigInt('0x' + ec.n.toString(16));
        const childPrivateKeyInt = (BigInt('0x' + parentPrivateKey) + BigInt('0x' + I.slice(0, 32).toString('hex'))) % modN;
        const childPrivateKey = childPrivateKeyInt.toString(16).padStart(64, '0');

        return childPrivateKey;
    }

    // Get address at specific derivation path
    getAddress(account = 0, change = 0, index = 0) {
        // Derive path: m/44'/coinType'/account'/change/index
        let currentKey = this.masterPrivateKey;

        // m/44' (purpose hardened)
        currentKey = this.deriveChildKey(currentKey, 44, true);

        // m/44'/coinType' (coin type hardened - using 1337 for Afrocoin)
        currentKey = this.deriveChildKey(currentKey, 1337, true);

        // m/44'/coinType'/account' (account hardened)
        currentKey = this.deriveChildKey(currentKey, account, true);

        // m/44'/coinType'/account'/change (change)
        currentKey = this.deriveChildKey(currentKey, change, false);

        // m/44'/coinType'/account'/change/index (address index)
        currentKey = this.deriveChildKey(currentKey, index, false);

        const keyPair = ec.keyFromPrivate(currentKey);
        return {
            privateKey: currentKey,
            publicKey: keyPair.getPublic('hex'),
            address: keyPair.getPublic('hex'), // In this implementation, address = public key
            path: `m/44'/1337'/${account}'/${change}/${index}`
        };
    }

    // Generate seed phrase (simplified - not full BIP39)
    static generateSeedPhrase() {
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
            'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
            'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance'
        ];

        const phrase = [];
        for (let i = 0; i < 12; i++) {
            phrase.push(words[Math.floor(Math.random() * words.length)]);
        }

        return phrase.join(' ');
    }

    // Create HD wallet from seed phrase (simplified)
    static fromSeedPhrase(seedPhrase) {
        // Convert seed phrase to seed (simplified - not cryptographically secure)
        const hash = SHA256(seedPhrase).toString();
        const seed = hash + hash.substring(0, 32); // Extend to 64 chars

        return new HDWallet(seed);
    }

    // Get multiple addresses for different purposes
    getAddressBatch(count = 10, account = 0, change = 0) {
        const addresses = [];
        for (let i = 0; i < count; i++) {
            addresses.push(this.getAddress(account, change, i));
        }
        return addresses;
    }

    // Get receiving addresses (external chain)
    getReceivingAddresses(count = 10) {
        return this.getAddressBatch(count, 0, 0);
    }

    // Get change addresses (internal chain)
    getChangeAddresses(count = 10) {
        return this.getAddressBatch(count, 0, 1);
    }

    // Export wallet data for backup
    export() {
        return {
            masterSeed: this.masterSeed,
            masterPrivateKey: this.masterPrivateKey,
            masterPublicKey: this.masterPublicKey,
            created: new Date().toISOString()
        };
    }

    // Import wallet from backup
    static import(walletData) {
        const wallet = new HDWallet(walletData.masterSeed);
        return wallet;
    }
}

module.exports = HDWallet;
