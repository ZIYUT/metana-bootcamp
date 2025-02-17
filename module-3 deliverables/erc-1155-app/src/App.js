// src/App.js
import React, { useState, useEffect } from 'react';
import { getBalance, mintToken, getSigner } from './ethers'; // 引入ethers.js文件

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState({});
  const [networkError, setNetworkError] = useState(false);

  const SOPHOLIA_CHAIN_ID = 2000; // Sopholia网络的Chain ID

  // 获取当前账户地址
  const getAccount = async () => {
    const signer = await getSigner();
    if (signer) {
      const address = await signer.getAddress();
      setAccount(address);
      loadBalance(address); // 加载余额
    }
  };

  // 加载账户的token余额
  const loadBalance = async (address) => {
    const balances = {};
    for (let i = 0; i <= 6; i++) {
      balances[i] = await getBalance(address, i);
    }
    setBalance(balances);
  };

  // 监听网络变化，检查是否连接到Sopholia网络
  useEffect(() => {
    if (window.ethereum) {
      const checkNetwork = async () => {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(chainId) !== SOPHOLIA_CHAIN_ID) {
          setNetworkError(true);
        } else {
          setNetworkError(false);
        }
      };
      checkNetwork();
    }
  }, []);

  // 切换到Sopholia网络
  const switchToSopholia = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${SOPHOLIA_CHAIN_ID.toString(16)}`, // Sopholia的Chain ID
              chainName: 'Sopholia Testnet',
              rpcUrls: ['https://rpc.sopholia.io'],
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              blockExplorerUrls: ['https://sopholia.io'],
            },
          ],
        });
        setNetworkError(false); // 网络切换成功
      } catch (error) {
        console.error("Error switching network:", error);
      }
    }
  };

  // mint函数
  const mint = async (tokenId) => {
    const signer = await getSigner();
    const success = await mintToken(tokenId, signer);
    if (success) {
      loadBalance(account);
    }
  };

  return (
    <div>
      <h1>ERC1155 Minting App</h1>
      <div>
        <button onClick={getAccount}>Connect Wallet</button>
      </div>

      {networkError && (
        <div>
          <p>Please switch to the Sopholia network.</p>
          <button onClick={switchToSopholia}>Switch to Sopholia Network</button>
        </div>
      )}

      {account && (
        <>
          <h3>Wallet Address: {account}</h3>
          <div>
            {Object.entries(balance).map(([id, bal]) => (
              <p key={id}>Token {id} Balance: {bal}</p>
            ))}
          </div>

          {/* Mint buttons */}
          <div>
            <button onClick={() => mint(0)}>Mint Token 0</button>
            <button onClick={() => mint(1)}>Mint Token 1</button>
            <button onClick={() => mint(2)}>Mint Token 2</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;