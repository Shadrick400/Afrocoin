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
    execute(methodName, params = [], callerAddress, blockchain) {
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

            // Create sandboxed execution environment values (used when compiling)
            const sandbox = this.createSandbox(context);

            // Compile the contract code into persistent methods object if not already compiled
            if (!this._methods) {
                // Extract function names from the code
                const fnNames = [];
                const re = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
                let m;
                while ((m = re.exec(this.code)) !== null) {
                    fnNames.push(m[1]);
                }

                // Build export code to return an object with all discovered functions
                const exportCode = `${this.code}\nreturn { ${fnNames.map(n => `${n}: typeof ${n} === 'function' ? ${n} : undefined`).join(', ')} };`;

                const otherKeys = Object.keys(sandbox).filter(k => k !== 'params');
                const otherValues = otherKeys.map(k => sandbox[k]);

                const executionFunction = new Function(...otherKeys, exportCode);
                this._methods = executionFunction(...otherValues);
            }

            const method = this._methods[methodName];
            if (!method) throw new Error(`Method ${methodName} not found in contract`);

            // Call the method with given parameters
            const result = method.apply(null, params);

            // Note: We don't attempt to sync closure-local variables back into this.state automatically
            // unless the contract itself exposes state through returned results.

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
        const params = Array.isArray(sandbox.params) ? sandbox.params : [];
        // Provide the rest of sandbox as named arguments to the execution function so the contract code can close over them
        const otherKeys = Object.keys(sandbox).filter(k => k !== 'params');
        const otherValues = otherKeys.map(k => sandbox[k]);

        // Build execution code that returns a reference to the requested method
        const executionCode = `
            ${code}

            if (typeof ${methodName} !== 'function') {
                throw new Error('Method ${methodName} not found in contract');
            }

            return ${methodName};
        `;

        // Execute the code to get the actual function (closed over its environment)
        const executionFunction = new Function(...otherKeys, executionCode);
        const methodFunction = executionFunction(...otherValues);

        // Call the method with params as its arguments
        return methodFunction.apply(null, params);
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
