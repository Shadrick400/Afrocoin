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
        this.signatures = []; // Array of collected signatures { publicKey, signature }

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
                signerPublicKeys: this.signerPublicKeys.slice().sort() // Sort for consistent hashing
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

    // Legacy single signature
    signTransaction(signingKey) {
        // Allow signing with any key (tests expect a wrong-key signature to produce an invalid tx)
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    // Setup a multi-signature transaction (M-of-N)
    setupMultiSig(publicKeys, requiredSignatures) {
        if (!Array.isArray(publicKeys) || publicKeys.length < 1) {
            throw new Error('Invalid public keys for multi-sig');
        }
        if (!requiredSignatures || requiredSignatures < 1 || requiredSignatures > publicKeys.length) {
            throw new Error('Invalid required signatures count');
        }
        this.isMultiSig = true;
        this.signerPublicKeys = publicKeys.slice();
        this.requiredSignatures = requiredSignatures;
        this.totalSigners = publicKeys.length;
        this.signatures = [];
    }

    generateMultiSigAddress() {
        if (!this.isMultiSig) return '';
        return SHA256(JSON.stringify(this.signerPublicKeys.slice().sort()) + this.requiredSignatures).toString();
    }

    // Add a signature from one of the authorized signers
    addSignature(signingKey) {
        const pub = signingKey.getPublic('hex');
        if (!this.signerPublicKeys.includes(pub)) {
            throw new Error('Signer not authorized for this multisig transaction');
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64').toDER('hex');
        // Avoid duplicate signatures from the same public key
        if (this.signatures.find(s => s.publicKey === pub)) return false;
        this.signatures.push({ publicKey: pub, signature: sig });
        return true;
    }

    isValid() {
        // Mining rewards (fromAddress === null) are valid without signature unless this is a multisig transaction
        if (this.fromAddress === null && !this.isMultiSig) return true;

        if (this.isMultiSig) {
            if (!Array.isArray(this.signatures) || this.signatures.length < this.requiredSignatures) {
                return false;
            }

            let validCount = 0;
            const seen = new Set();
            for (const s of this.signatures) {
                if (seen.has(s.publicKey)) continue;
                if (!this.signerPublicKeys.includes(s.publicKey)) continue;
                const pubKey = ec.keyFromPublic(s.publicKey, 'hex');
                if (pubKey.verify(this.calculateHash(), s.signature)) {
                    validCount++;
                    seen.add(s.publicKey);
                }
            }
            return validCount >= this.requiredSignatures;
        }

        // Legacy single signature handling
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
