const SHA256 = require('crypto-js/sha256');

class SmartContract {
    constructor(code, ownerAddress, initialState = {}) {
        this.code = code; // Contract code as string
        this.ownerAddress = ownerAddress;
        this.address = this.generateAddress();
        this.state = { ...initialState }; // Contract state/storage
        this.createdAt = Date.now();
        this.transactions = []; // Contract execution history
    }

    generateAddress() {
        const contractData = this.ownerAddress + this.code + Date.now();
        return SHA256(contractData).toString();
    }

    // Execute contract method with given parameters
    execute(methodName, params = {}, callerAddress, blockchain) {
        try {
            // Create execution context
            const context = {
                state: this.state,
                params: params,
                caller: callerAddress,
                owner: this.ownerAddress,
                blockchain: blockchain,
                contractAddress: this.address,
                timestamp: Date.now()
            };

            // Create sandboxed execution environment
            const sandbox = this.createSandbox(context);

            // Execute the contract method
            const result = this.runInSandbox(this.code, methodName, sandbox);

            // Update state if modified
            this.state = { ...context.state };

            // Record transaction
            this.transactions.push({
                method: methodName,
                params: params,
                caller: callerAddress,
                timestamp: Date.now(),
                result: result
            });

            return {
                success: true,
                result: result,
                state: this.state
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    createSandbox(context) {
        // Create a restricted execution environment
        const sandbox = {
            // Contract state access
            state: context.state,
            params: context.params,

            // Blockchain utilities
            getBalance: (address) => context.blockchain.balance(address),
            transfer: (to, amount) => {
                // This would trigger a blockchain transfer
                return { to, amount, from: context.contractAddress };
            },

            // Math utilities
            Math: Math,

            // Basic utilities
            Date: Date,
            parseInt: parseInt,
            parseFloat: parseFloat,

            // Contract utilities
            require: (condition, message = 'Contract condition failed') => {
                if (!condition) throw new Error(message);
            },

            assert: (condition, message = 'Assertion failed') => {
                if (!condition) throw new Error(message);
            }
        };

        return sandbox;
    }

    runInSandbox(code, methodName, sandbox) {
        // Create the execution function
        const executionCode = `
            (function() {
                ${code}

                // Check if method exists
                if (typeof ${methodName} !== 'function') {
                    throw new Error('Method ${methodName} not found in contract');
                }

                // Execute the method
                return ${methodName}.apply(null, arguments);
            })
        `;

        // Execute in sandbox
        const executionFunction = new Function(...Object.keys(sandbox), executionCode);
        return executionFunction(...Object.values(sandbox));
    }

    // Get contract info
    getInfo() {
        return {
            address: this.address,
            owner: this.ownerAddress,
            createdAt: this.createdAt,
            transactionCount: this.transactions.length,
            state: this.state
        };
    }

    // Serialize for storage
    toJSON() {
        return {
            code: this.code,
            ownerAddress: this.ownerAddress,
            address: this.address,
            state: this.state,
            createdAt: this.createdAt,
            transactions: this.transactions
        };
    }

    // Deserialize from storage
    static fromJSON(data) {
        const contract = new SmartContract(data.code, data.ownerAddress, data.state);
        contract.address = data.address;
        contract.createdAt = data.createdAt;
        contract.transactions = data.transactions || [];
        return contract;
    }
}

module.exports = SmartContract;
