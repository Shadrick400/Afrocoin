const API_URL = 'http://localhost:3001';

// --- WALLET FUNCTIONS ---
async function generateWallet() {
    try {
        const response = await axios.get(`${API_URL}/wallet/new`);
        const { publicKey, privateKey } = response.data;

        document.getElementById('my-address').value = publicKey;
        document.getElementById('my-private-key').value = privateKey;
        document.getElementById('wallet-info').classList.remove('hidden');

        // Auto-fill miner address for convenience
        document.getElementById('miner-address').value = publicKey;
    } catch (error) {
        alert('Error generating wallet: ' + error.message);
    }
}

async function checkBalance() {
    const address = document.getElementById('balance-address').value;
    if (!address) return alert('Please enter an address');

    try {
        const response = await axios.get(`${API_URL}/balance/${address}`);
        document.getElementById('balance-display').innerText = `Balance: ${response.data.balance} Afrocoins`;
    } catch (error) {
        document.getElementById('balance-display').innerText = 'Error fetching balance';
    }
}

// --- MINING ---
async function mineBlock() {
    const minerAddress = document.getElementById('miner-address').value;
    if (!minerAddress) return alert('Please enter a miner address');

    const statusDiv = document.getElementById('mine-status');
    statusDiv.style.color = '#e2e8f0';
    statusDiv.innerText = '⛏️ Mining... please wait...';

    try {
        await axios.post(`${API_URL}/mine`, { minerAddress });
        statusDiv.style.color = 'var(--success)';
        statusDiv.innerText = '✅ Block mined successfully! Reward sent.';
        loadBlocks(); // Refresh chain
        // Refresh balance if the miner address is the one in the balance check
        if (document.getElementById('balance-address').value === minerAddress) {
            checkBalance();
        }
    } catch (error) {
        statusDiv.style.color = '#f87171';
        statusDiv.innerText = 'Mining failed: ' + (error.response?.data?.error || error.message);
    }
}

// --- TRANSACTIONS ---
async function sendTransaction() {
    const privateKey = document.getElementById('tx-private-key').value;
    const toAddress = document.getElementById('tx-to-address').value;
    const amount = document.getElementById('tx-amount').value;

    // We can't derive public key from private key easily in frontend without lib,
    // but the backend needs 'fromAddress' AND 'privateKey' (to sign).
    // Wait, the backend /transact needs fromAddress?
    // Let's check server.js... YES: const { fromAddress, toAddress, amount, privateKey } = req.body;

    // This is a small UX issue. The user knows their private key, but usually the wallet 
    // software derives the public key (fromAddress) automatically.
    // Since we don't have the crypto lib here, I'll ask the user to input their 
    // FROM address too, OR we can try to be clever. 
    // Let's just ask for FROM ADDR to be safe/simple, or modify server.js to derive it.

    // FIX: I will modify the input fields in HTML to include "From Address" as well for now.
    // Actually, let's just add it to HTML.

    // Better yet, let's assume the user copies their address from the wallet section.

    const fromAddress = document.getElementById('my-address').value; // Using the generated one

    if (!fromAddress) return alert('Please generate a wallet first to get your FROM address (or fill it manually)');
    if (!privateKey || !toAddress || !amount) return alert('Please fill all fields');

    const statusDiv = document.getElementById('tx-status');
    statusDiv.innerText = 'Sending...';

    try {
        await axios.post(`${API_URL}/transact`, {
            fromAddress,
            toAddress,
            amount: Number(amount),
            privateKey
        });
        statusDiv.style.color = 'var(--success)';
        statusDiv.innerText = '✅ Transaction sent! Mine a block to process it.';
    } catch (error) {
        statusDiv.style.color = '#f87171';
        statusDiv.innerText = 'Failed: ' + (error.response?.data?.error || error.message);
    }
}

// --- EXPLORER ---
async function loadBlocks() {
    const container = document.getElementById('chain-container');
    container.innerHTML = 'Loading...';

    try {
        const response = await axios.get(`${API_URL}/blocks`);
        const blocks = response.data;

        container.innerHTML = '';

        blocks.slice().reverse().forEach((block, index) => {
            const realIndex = blocks.length - 1 - index;
            const div = document.createElement('div');
            div.className = 'block';
            div.innerHTML = `
                <strong>📦 Block #${realIndex}</strong> <span style="float:right; opacity:0.5">${new Date(block.timestamp).toLocaleString()}</span><br>
                <div style="margin-top:5px; word-break:break-all;">
                    Hash: <span style="color:#cbd5e1">${block.hash}</span><br>
                    Prev: <span style="color:#94a3b8">${block.previousHash.substring(0, 20)}...</span>
                </div>
                <div style="margin-top:10px; border-top:1px solid #334155; padding-top:5px;">
                    Tx count: ${block.transactions.length}
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerText = 'Failed to load blockchain';
    }
}

// Initial Load
loadBlocks();
