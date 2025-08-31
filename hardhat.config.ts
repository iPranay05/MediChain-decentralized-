require("@nomiclabs/hardhat-ethers");
require("dotenv").config({ path: '.env.local' });

// Get private key from environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 50
      }
    }
  },
  paths: {
    artifacts: './src/artifacts',
    sources: './contracts',
    cache: './cache',
    tests: './test'
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
};
