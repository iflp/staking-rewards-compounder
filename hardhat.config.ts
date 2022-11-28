import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: `0.8.17`,
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000
          }
        }
      }
    ]
  },
  networks: {
    arbitrum: {
      url: process.env.ARB_RPC ?? ``,
      accounts: [process.env.ARB_PRIVATE_KEY ?? ``]
    },
    arbitest: {
      url: process.env.ARB_TESTNET_RPC ?? ``,
      accounts: [process.env.ARB_TESTNET_PRIVATE_KEY ?? ``]
    }
  }
};

export default config;
