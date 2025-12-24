const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
    constructor(fromAddress, toAddress, amount, fee = 0) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.fee = fee;
        this.timestamp = Date.now();

        // Multi-signature fields
        this.isMultiSig = false;
        this.requiredSignatures = 1; // M in M-of-N
        this.totalSigners = 1; // N in M-of-N
        this.signerPublicKeys = []; // Array of authorized signer public keys
        this.signatures = []; // Array of collected signatures

        // Smart contract fields
        this.isContractCall = false;
        this.contractAddress = null;
        this.methodName = null;
        this.methodParams = {};

        // Legacy single-sig field (for backward compatibility)
        this.signature = '';
    }

    calculateHash() {
        // Include multi-sig fields in hash calculation
        const multiSigData = this.isMultiSig ?
            JSON.stringify({
                requiredSignatures: this.requiredSignatures,
                totalSigners: this.totalSigners,
                signerPublicKeys: this.signerPublicKeys.sort() // Sort for consistent hashing
            }) : '';

        return SHA256(
            this.fromAddress +
            this.toAddress +
            this.amount +
            this.fee +
            this.timestamp +
            multiSigData
        ).toString();
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        // Mining rewards (fromAddress === null) are valid without signature
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }

    static fromJSON(data) {
        const tx = new Transaction(data.fromAddress, data.toAddress, data.amount, data.fee || 0);
        tx.timestamp = data.timestamp;
        tx.signature = data.signature || '';

        // Multi-sig fields
        tx.isMultiSig = data.isMultiSig || false;
        tx.requiredSignatures = data.requiredSignatures || 1;
        tx.totalSigners = data.totalSigners || 1;
        tx.signerPublicKeys = data.signerPublicKeys || [];
        tx.signatures = data.signatures || [];

        // Smart contract fields
        tx.isContractCall = data.isContractCall || false;
        tx.contractAddress = data.contractAddress || null;
        tx.methodName = data.methodName || null;
        tx.methodParams = data.methodParams || {};

        return tx;
    }
}

module.exports = Transaction;
