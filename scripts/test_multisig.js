const Transaction = require('../transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function assert(cond, msg) {
    if (!cond) {
        console.error('FAIL:', msg);
        process.exit(2);
    } else {
        console.log('PASS:', msg);
    }
}

// Create 3 signers
const s1 = ec.genKeyPair();
const s2 = ec.genKeyPair();
const s3 = ec.genKeyPair();
const pubs = [s1.getPublic('hex'), s2.getPublic('hex'), s3.getPublic('hex')];

const tx = new Transaction(null, 'recipient', 10);
// Set fromAddress to multisig (not used in this test)

tx.setupMultiSig(pubs, 2);
assert(tx.generateMultiSigAddress().length > 0, 'generateMultiSigAddress');

tx.addSignature(s1);
tx.addSignature(s2);
assert(tx.isValid(), 'multi-sig valid with 2 signatures');

const tx2 = new Transaction(null, 'recipient', 5);
tx2.setupMultiSig(pubs, 2);
tx2.addSignature(s1);
assert(!tx2.isValid(), 'multi-sig invalid with insufficient signatures');

console.log('\nAll multisig tests passed');
process.exit(0);
