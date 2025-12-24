const { spawn } = require('child_process');
const axios = require('axios');

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
    // Start server
    const server = spawn('node', ['server.js'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });

    let started = false;
    server.stdout.on('data', d => {
        const s = d.toString();
        process.stdout.write(s);
        if (s.includes('API Server running')) started = true;
    });

    server.stderr.on('data', d => process.stderr.write(d.toString()));

    // Wait up to 5s
    for (let i=0;i<25;i++){
        if (started) break;
        await wait(200);
    }

    if (!started) {
        console.error('Server did not start');
        server.kill();
        process.exit(2);
    }

    try {
        // 1. Create a wallet
        const w = await axios.get('http://localhost:3001/wallet/new');
        const pub = w.data.publicKey;
        const priv = w.data.privateKey;

        // 2. Try overspend
        try {
            await axios.post('http://localhost:3001/transact', { fromAddress: pub, toAddress: 'x', amount: 10000, privateKey: priv });
            console.error('FAIL: overspend accepted');
            process.exit(2);
        } catch (e) {
            console.log('PASS: overspend rejected');
        }

        // 3. Invalid amount
        try {
            await axios.post('http://localhost:3001/transact', { fromAddress: pub, toAddress: 'x', amount: -5, privateKey: priv });
            console.error('FAIL: negative amount accepted');
            process.exit(2);
        } catch (e) {
            console.log('PASS: negative amount rejected');
        }

    } finally {
        server.kill();
    }

    console.log('\nHTTP integration tests passed');
    process.exit(0);
})();