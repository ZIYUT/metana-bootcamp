require('dotenv').config();
const axios = require('axios');
const { keccak256 } = require('@noble/hashes');
const { Transaction } = require('ethereumjs-tx');
const Common = require('ethereumjs-common').default;
const readline = require('readline');

// 配置（从环境变量加载）
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = 'https://rpc.sepolia.org';
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 辅助函数：将数值转为十六进制
function toHex(value) {
    return '0x' + BigInt(value).toString(16);
}

// 辅助函数：移除 '0x' 前缀
function stripHexPrefix(str) {
    return str.startsWith('0x') ? str.slice(2) : str;
}

// 验证以太坊地址格式
function isValidAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// 获取账户 nonce
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

// 估算 gas
async function estimateGas(from, to, data, value = '0x0') {
    const payload = {
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [{ from, to, data, value }],
        id: 1,
    };
    const response = await axios.post(RPC_URL, payload);
    return parseInt(response.data.result, 16);
}

// 构造并签名交易
async function createAndSignTx(recipient, amountWei, privateKey) {
    const nonce = await getNonce(WALLET_ADDRESS);
    const gasPrice = toHex((await axios.post(RPC_URL, {
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
    })).data.result);

    // 编码 transferETH(address,uint256) 函数调用
    const functionSignature = '0x0f2c8b35'; // keccak256("transferETH(address,uint256)")
    const recipientAddr = stripHexPrefix(recipient).padStart(64, '0');
    const amountHex = toHex(amountWei).slice(2).padStart(64, '0');
    const data = functionSignature + recipientAddr + amountHex;

    const gasLimit = toHex(await estimateGas(WALLET_ADDRESS, CONTRACT_ADDRESS, data));

    // 交易参数
    const txParams = {
        nonce: toHex(nonce),
        gasPrice,
        gasLimit,
        to: CONTRACT_ADDRESS,
        value: '0x0',
        data,
    };

    // 配置 Sepolia 链
    const common = Common.forCustomChain(
        'mainnet',
        {
            name: 'sepolia',
            networkId: 11155111,
            chainId: 11155111,
        },
        'petersburg'
    );

    // 签名交易
    const tx = new Transaction(txParams, { common });
    const privateKeyBuffer = Buffer.from(stripHexPrefix(privateKey), 'hex');
    tx.sign(privateKeyBuffer);
    return '0x' + tx.serialize().toString('hex');
}

// 广播交易
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

// 主函数：执行 ETH 转移
async function main() {
    try {
        // 验证环境变量
        if (!PRIVATE_KEY || !WALLET_ADDRESS || !CONTRACT_ADDRESS) {
            throw new Error('Missing environment variables. Please check .env file.');
        }
        if (!isValidAddress(WALLET_ADDRESS) || !isValidAddress(CONTRACT_ADDRESS)) {
            throw new Error('Invalid address format in environment variables.');
        }

        // 提示用户输入接收者地址
        const recipient = await new Promise((resolve) => {
            rl.question('请输入接收者地址 (0x...): ', (answer) => {
                resolve(answer.trim());
            });
        });

        // 验证输入的地址
        if (!isValidAddress(recipient)) {
            throw new Error('Invalid recipient address.');
        }

        const amount = BigInt('10000000000000000'); // 0.01 ETH
        console.log('创建并签名交易...');
        const signedTx = await createAndSignTx(recipient, amount, PRIVATE_KEY);
        console.log('广播交易...');
        const txHash = await broadcastTx(signedTx);
        console.log('交易哈希:', txHash);
    } catch (error) {
        console.error('错误:', error.message);
    } finally {
        rl.close();
    }
}

// 运行脚本
main();

// 运行说明：
// 1. 创建 .env 文件，添加 PRIVATE_KEY、WALLET_ADDRESS、CONTRACT_ADDRESS。
// 2. 安装依赖：npm install dotenv axios @noble/hashes ethereumjs-tx ethereumjs-common
// 3. 运行：node wallet.js
// 4. 按提示输入接收者地址。
// 5. 确保 WALLET_ADDRESS 有测试 ETH，CONTRACT_ADDRESS 有 ETH。