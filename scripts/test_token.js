const ERC20Token = require('../token_standard');

function assert(cond, msg) {
    if (!cond) {
        console.error('FAIL:', msg);
        process.exit(2);
    } else {
        console.log('PASS:', msg);
    }
}

const token = new ERC20Token('UnitTest', 'UT', 18, 1000);
const deployer = 'deployer1';

token.initialize(deployer);
assert(token.balanceOf(deployer) === 1000, 'deployer has initial supply');

const recipient = 'user1';
const ok = token.transfer(deployer, recipient, 100);
assert(ok, 'transfer returns true');
assert(token.balanceOf(deployer) === 900, 'deployer reduced');
assert(token.balanceOf(recipient) === 100, 'recipient increased');

console.log('\nAll token tests passed');
process.exit(0);
