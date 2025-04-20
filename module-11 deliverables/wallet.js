require('dotenv').config();
const axios = require('axios');
const { keccak256 } = require('@noble/hashes/sha3');
const { Transaction } = require('ethereumjs-tx');
const Common = require('ethereumjs-common').default;
const readline = require('readline');

// 配置（从环境变量加载）
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/bA5XfMFqseqSauR46dvb8--1C5qQgoXI';

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 辅助函数：将数值转为十六进制
function toHex(value) {
    // 如果已经是 BigInt 类型，直接使用
    if (typeof value === 'bigint') {
        return '0x' + value.toString(16);
    }
    
    // 如果是一般数字或字符串，先检查有效性
    if (value === undefined || value === null || (typeof value !== 'bigint' && isNaN(value))) {
        console.error('toHex 收到了无效值:', value);
        throw new Error(`无法将 ${value} 转换为十六进制`);
    }
    
    // 转换为 BigInt 并转十六进制
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
    try {
        const payload = {
            jsonrpc: '2.0',
            method: 'eth_estimateGas',
            params: [{ from, to, data, value }],
            id: 1,
        };
        console.log('估算 gas 参数:', payload);
        const response = await axios.post(RPC_URL, payload);
        
        if (!response.data || !response.data.result) {
            throw new Error('估算 gas 失败: ' + JSON.stringify(response.data));
        }
        
        return parseInt(response.data.result, 16);
    } catch (error) {
        console.error('估算 gas 出错:', error.message);
        if (error.response && error.response.data) {
            console.error('RPC 错误详情:', error.response.data);
        }
        throw new Error(`估算 gas 失败: ${error.message}`);
    }
}

// 构造并签名交易
async function createAndSignTx(recipient, amountWei, privateKey) {
    try {
        const nonce = await getNonce(WALLET_ADDRESS);
        console.log('获取到 nonce:', nonce);
        
        // 获取 gas 价格
        const gasPriceResponse = await axios.post(RPC_URL, {
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
        });
        
        if (!gasPriceResponse.data || !gasPriceResponse.data.result) {
            throw new Error('获取 gasPrice 失败: ' + JSON.stringify(gasPriceResponse.data));
        }
        
        const gasPriceHex = gasPriceResponse.data.result;
        const gasPrice = toHex(parseInt(gasPriceHex, 16));
        console.log('获取到 gasPrice:', gasPrice);

        // 编码 transferETH(address,uint256) 函数调用
        const functionSignature = '0x0f2c8b35'; // keccak256("transferETH(address,uint256)")
        const recipientAddr = stripHexPrefix(recipient).padStart(64, '0');
        const amountHex = toHex(amountWei).slice(2).padStart(64, '0');
        const data = functionSignature + recipientAddr + amountHex;
        
        // 使用硬编码的 gas 限制
        const gasLimit = toHex(300000); // 使用足够高的值，确保交易不会因 gas 不足而失败
        console.log('使用硬编码的 gasLimit:', gasLimit);

        // 交易参数
        const txParams = {
            nonce: toHex(nonce),
            gasPrice,
            gasLimit,
            to: CONTRACT_ADDRESS,
            value: '0x0',
            data,
        };
        
        console.log('交易参数:', txParams);

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
    } catch (error) {
        console.error('创建交易失败:', error);
        throw error;
    }
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

        // 提示用户输入金额
        const amountETH = await new Promise((resolve) => {
            rl.question('请输入转账金额 (ETH): ', (answer) => {
                resolve(answer.trim());
            });
        });

        // 验证输入的金额是否为有效数字
        const amountFloat = parseFloat(amountETH);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            throw new Error('无效的金额。请输入大于0的数字。');
        }

        // 转换为Wei (1 ETH = 10^18 Wei)
        const amount = BigInt(Math.floor(amountFloat * 1e18));
        
        console.log(`转账金额: ${amountFloat} ETH (${amount} Wei)`);
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
// 3. 部署 Wallet.sol 到 Sepolia，获取 CONTRACT_ADDRESS。
// 4. 向 CONTRACT_ADDRESS 转入测试 ETH。
// 5. 运行：node wallet.js
// 6. 按提示输入接收者地址和转账金额。
// 7. 确保 WALLET_ADDRESS 有测试 ETH，CONTRACT_ADDRESS 有 ETH。