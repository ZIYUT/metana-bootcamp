/** @type {import('next').NextConfig} */
const nextConfig = {};

export default {
    env: {
      ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
      ALCHEMY_NETWORK: process.env.ALCHEMY_NETWORK,
      TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    },
  };