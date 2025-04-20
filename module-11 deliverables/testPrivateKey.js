const { ethers } = require('ethers');

function verifyKeyPair(privateKey, expectedAddress) {
    try {
        // 确保私钥格式正确
        if (!privateKey.startsWith('0x')) {
            privateKey = '0x' + privateKey;
        }
        
        // 从私钥创建钱包实例
        const wallet = new ethers.Wallet(privateKey);
        
        // 获取派生的地址
        const derivedAddress = wallet.address;
        
        // 比较地址（不区分大小写）
        const isMatch = derivedAddress.toLowerCase() === expectedAddress.toLowerCase();
        
        console.log('派生地址:', derivedAddress);
        console.log('期望地址:', expectedAddress);
        console.log('匹配结果:', isMatch ? '✅ 匹配' : '❌ 不匹配');
        
        return isMatch;
    } catch (error) {
        console.error('验证失败:', error.message);
        return false;
    }
}

// 使用示例
const privateKey = '0xf49ffb0a935340fcef7b1ce24dd1cf8564fd4057c7c0c6001b5276bbd7e0b169';
const expectedAddress = '0xd468d8Fd7F34F3aF715E3E3C3A74d8715989de6D';

verifyKeyPair(privateKey, expectedAddress);