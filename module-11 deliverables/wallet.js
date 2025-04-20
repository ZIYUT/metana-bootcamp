require('dotenv').config();
const axios = require('axios');
const { keccak256 } = require('@noble/hashes/sha3');
const { Transaction } = require('ethereumjs-tx');
const Common = require('ethereumjs-common').default;
const readline = require('readline');

// Configuration (loaded from environment variables)
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/bA5XfMFqseqSauR46dvb8--1C5qQgoXI';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function: Convert value to hexadecimal
function toHex(value) {
    // If already a BigInt type, use directly
    if (typeof value === 'bigint') {
        return '0x' + value.toString(16);
    }
    
    // Check validity for numbers or strings
    if (value === undefined || value === null || (typeof value !== 'bigint' && isNaN(value))) {
        console.error('toHex received invalid value:', value);
        throw new Error(`Cannot convert ${value} to hexadecimal`);
    }
    
    // Convert to BigInt and then to hexadecimal
    return '0x' + BigInt(value).toString(16);
}

// Helper function: Remove '0x' prefix
function stripHexPrefix(str) {
    return str.startsWith('0x') ? str.slice(2) : str;
}

// Validate Ethereum address format
function isValidAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// Get account nonce
async function getNonce(address) {
    const payload = {
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1,
    };
    const response = await axios.post(RPC_URL, payload);
    return parseInt(response.data.result, 16);
}

// Estimate gas
async function estimateGas(from, to, data, value = '0x0') {
    try {
        const payload = {
            jsonrpc: '2.0',
            method: 'eth_estimateGas',
            params: [{ from, to, data, value }],
            id: 1,
        };
        console.log('Gas estimation parameters:', payload);
        const response = await axios.post(RPC_URL, payload);
        
        if (!response.data || !response.data.result) {
            throw new Error('Gas estimation failed: ' + JSON.stringify(response.data));
        }
        
        return parseInt(response.data.result, 16);
    } catch (error) {
        console.error('Gas estimation error:', error.message);
        if (error.response && error.response.data) {
            console.error('RPC error details:', error.response.data);
        }
        throw new Error(`Gas estimation failed: ${error.message}`);
    }
}

// Create and sign transaction
async function createAndSignTx(recipient, amountWei, privateKey) {
    try {
        const nonce = await getNonce(WALLET_ADDRESS);
        console.log('Retrieved nonce:', nonce);
        
        // Get gas price
        const gasPriceResponse = await axios.post(RPC_URL, {
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
        });
        
        if (!gasPriceResponse.data || !gasPriceResponse.data.result) {
            throw new Error('Failed to get gasPrice: ' + JSON.stringify(gasPriceResponse.data));
        }
        
        const gasPriceHex = gasPriceResponse.data.result;
        const gasPrice = toHex(parseInt(gasPriceHex, 16));
        console.log('Retrieved gasPrice:', gasPrice);

        // Encode transferETH(address,uint256) function call
        const functionSignature = '0x7b1a4909'; // Actual deployed contract's transferETH function selector
        const recipientAddr = stripHexPrefix(recipient).padStart(64, '0');
        const amountHex = toHex(amountWei).slice(2).padStart(64, '0');
        const data = functionSignature + recipientAddr + amountHex;
        
        // Use hardcoded gas limit
        const gasLimit = toHex(300000); // Use a high enough value to ensure transaction doesn't fail due to insufficient gas
        console.log('Using hardcoded gasLimit:', gasLimit);

        // Transaction parameters
        const txParams = {
            nonce: toHex(nonce),
            gasPrice,
            gasLimit,
            to: CONTRACT_ADDRESS,
            value: '0x0',
            data,
        };
        
        console.log('Transaction parameters:', txParams);

        // Configure Sepolia chain
        const common = Common.forCustomChain(
            'mainnet',
            {
                name: 'sepolia',
                networkId: 11155111,
                chainId: 11155111,
            },
            'petersburg'
        );

        // Sign transaction
        const tx = new Transaction(txParams, { common });
        const privateKeyBuffer = Buffer.from(stripHexPrefix(privateKey), 'hex');
        tx.sign(privateKeyBuffer);
        return '0x' + tx.serialize().toString('hex');
    } catch (error) {
        console.error('Transaction creation failed:', error);
        throw error;
    }
}

// Broadcast transaction
async function broadcastTx(signedTx) {
    const payload = {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedTx],
        id: 1,
    };
    const response = await axios.post(RPC_URL, payload);
    return response.data.result;
}

// Main function: Execute ETH transfer
async function main() {
    try {
        // Validate environment variables
        if (!PRIVATE_KEY || !WALLET_ADDRESS || !CONTRACT_ADDRESS) {
            throw new Error('Missing environment variables. Please check .env file.');
        }
        if (!isValidAddress(WALLET_ADDRESS) || !isValidAddress(CONTRACT_ADDRESS)) {
            throw new Error('Invalid address format in environment variables.');
        }

        // Prompt user for recipient address
        const recipient = await new Promise((resolve) => {
            rl.question('Enter recipient address (0x...): ', (answer) => {
                resolve(answer.trim());
            });
        });

        // Validate input address
        if (!isValidAddress(recipient)) {
            throw new Error('Invalid recipient address.');
        }

        // Prompt user for amount
        const amountETH = await new Promise((resolve) => {
            rl.question('Enter transfer amount (ETH): ', (answer) => {
                resolve(answer.trim());
            });
        });

        // Validate the amount is a valid number
        const amountFloat = parseFloat(amountETH);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            throw new Error('Invalid amount. Please enter a number greater than 0.');
        }

        // Convert to Wei (1 ETH = 10^18 Wei)
        const amount = BigInt(Math.floor(amountFloat * 1e18));
        
        console.log(`Transfer amount: ${amountFloat} ETH (${amount} Wei)`);
        console.log('Creating and signing transaction...');
        const signedTx = await createAndSignTx(recipient, amount, PRIVATE_KEY);
        console.log('Broadcasting transaction...');
        const txHash = await broadcastTx(signedTx);
        console.log('Transaction hash:', txHash);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
}

// Run script
main();

// Usage instructions:
// 1. Create .env file with PRIVATE_KEY, WALLET_ADDRESS, CONTRACT_ADDRESS
// 2. Install dependencies: npm install dotenv axios @noble/hashes ethereumjs-tx ethereumjs-common
// 3. Deploy CryptoWallet.sol to Sepolia, get CONTRACT_ADDRESS
// 4. Send test ETH to CONTRACT_ADDRESS
// 5. Run: node wallet.js
// 6. Follow prompts for recipient address and transfer amount
// 7. Ensure WALLET_ADDRESS has test ETH, CONTRACT_ADDRESS has ETH