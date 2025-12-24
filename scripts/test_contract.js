const Afrocoin = require('../afrocoin');
const SmartContract = require('../smart_contract');

const af = new Afrocoin();
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
const addr = af.deployContract(contract);
console.log('deployed', addr);
const res1 = af.callContract(addr, 'balanceOf', ['owner123']);
console.log('call result:', res1);
const res2 = af.callContract(addr, 'transfer', ['owner123', 'user456', 100]);
console.log('transfer:', res2);
console.log('contract state after calls:', contract.state);
