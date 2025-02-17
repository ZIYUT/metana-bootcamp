// src/web3Config.js
import { createClient, WagmiConfig, configureChains, chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { polygon } from 'wagmi/chains';

// 配置链和连接器
const { chains, provider, webSocketProvider } = configureChains(
  [polygon], // Polygon 网络
  [
    // 设置公共RPC
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === polygon.id) {
          return { http: 'https://polygon-rpc.com' };
        }
      },
    }),
  ]
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
  ],
  provider,
  webSocketProvider,
});

export { wagmiClient, chains, RainbowKitProvider, darkTheme };