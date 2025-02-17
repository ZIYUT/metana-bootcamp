import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { contractAddress, ERC1155_ABI } from './contractConfig'; // 引入合约配置文件

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkNetwork = async () => {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId) !== 2000) {
        setError("Please switch to Sopholia network.");
      }
    };
    if (window.ethereum) {
      checkNetwork();
    }
  }, []);

  // 获取用户的地址和余额
  const getAccount = async () => {
    const signer = await getSigner();
    if (signer) {
      const address = await signer.getAddress();
      setAccount(address);
      loadBalance(address);
    }
  };

  // 加载余额
  const loadBalance = async (address) => {
    const balances = {};
    for (let i = 0; i <= 6; i++) {
      const bal = await getTokenBalance(address, i); // 调用 tokenBalanceOf 方法来获取余额
      balances[i] = bal;
    }
    setBalance(balances); // 更新余额
  };

  // 获取代币余额
  const getTokenBalance = async (address, tokenId) => {
    const signer = await getSigner();
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
    try {
      const balance = await contract.tokenBalanceOf(address, tokenId);
      return balance.toString(); // 转换为字符串格式
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  };

  // 获取 signer
  const getSigner = async () => {
    if (window.ethereum) {
      const provider = new Web3Provider(window.ethereum); // 使用 Web3Provider 来连接钱包
      await provider.send("eth_requestAccounts", []); // 请求连接钱包
      const signer = provider.getSigner();
      return signer;
    } else {
      setError("Please install MetaMask");
      return null;
    }
  };

  // 铸造代币函数
  const mint = async (tokenId) => {
    if (loading) return; // 防止重复点击

    setLoading(true);
    setError(''); // 重置错误信息

    const signer = await getSigner();
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);

    try {
      if (tokenId === 0) {
        // 铸造 Token 0
        const tx = await contract.mintToken0();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 1) {
        // 铸造 Token 1
        const tx = await contract.mintToken1();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 2) {
        // 铸造 Token 2
        const tx = await contract.mintToken2();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 3 && balance[0] >= 1 && balance[1] >= 1) {
        // 铸造 Token 3：需要烧掉 Token 0 和 Token 1
        const tx = await contract.mintToken3();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 4 && balance[1] >= 1 && balance[2] >= 1) {
        // 铸造 Token 4：需要烧掉 Token 1 和 Token 2
        const tx = await contract.mintToken4();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 5 && balance[0] >= 1 && balance[2] >= 1) {
        // 铸造 Token 5：需要烧掉 Token 0 和 Token 2
        const tx = await contract.mintToken5();
        await tx.wait(); // 等待交易确认
      } else if (tokenId === 6 && balance[0] >= 1 && balance[1] >= 1 && balance[2] >= 1) {
        // 铸造 Token 6：需要烧掉 Token 0、Token 1 和 Token 2
        const tx = await contract.mintToken6();
        await tx.wait(); // 等待交易确认
      } else {
        setError("Not enough tokens to mint this token.");
        setLoading(false);
        return;
      }

      // 更新余额，确保交易成功后加载最新的余额
      await loadBalance(account); // 重新加载余额
    } catch (err) {
      console.error(err);
      setError("Minting failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>ERC1155 Token Minting</h1>
      <div>
        <button onClick={getAccount}>Connect Wallet</button>
      </div>

      {account && (
        <div>
          <h3>Wallet: {account}</h3>
          <div>
            {Object.entries(balance).map(([id, bal]) => (
              <p key={id}>Token {id} Balance: {bal}</p>
            ))}
          </div>

          <div>
            {/* 保留现有的 mint token0-2 按钮 */}
            <button onClick={() => mint(0)} disabled={loading}>Mint Token 0</button>
            <button onClick={() => mint(1)} disabled={loading}>Mint Token 1</button>
            <button onClick={() => mint(2)} disabled={loading}>Mint Token 2</button>

            {/* 新增 mint token 3-6 按钮 */}
            <button onClick={() => mint(3)} disabled={loading}>Mint Token 3</button>
            <button onClick={() => mint(4)} disabled={loading}>Mint Token 4</button>
            <button onClick={() => mint(5)} disabled={loading}>Mint Token 5</button>
            <button onClick={() => mint(6)} disabled={loading}>Mint Token 6</button>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;