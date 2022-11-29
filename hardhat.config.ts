import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import "hardhat-gas-reporter"
import '@nomicfoundation/hardhat-toolbox';
dotenv.config();

// The test private keys are well-known and used as an example only
const PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

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
            accounts: [process.env.ARB_PRIVATE_KEY ?? PRIVATE_KEY]
        },
        arbitest: {
            url: process.env.ARB_TESTNET_RPC ?? ``,
            accounts: [process.env.ARB_TESTNET_PRIVATE_KEY ?? PRIVATE_KEY]
        }
    }
};

export default config;
