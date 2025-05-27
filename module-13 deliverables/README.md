# Arbitrage Dashboard

A decentralized application for tracking and analyzing crypto price differences across different exchanges.

## Project Structure

- `hardhat-contracts/`: Smart contracts for price oracle and arbitrage tracking
- `oracle-app/`: Next.js frontend dashboard application

## Live Demo

The application is currently deployed at: [https://arbitracks.vercel.app/](https://arbitracks.vercel.app/)

## Development

### Smart Contracts

Navigate to the `hardhat-contracts` directory to work with the smart contracts:

```bash
cd hardhat-contracts
npm install
npx hardhat compile
```

### Frontend Dashboard

Navigate to the `oracle-app` directory to work with the frontend:

```bash
cd oracle-app
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000). 