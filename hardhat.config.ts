/* eslint-disable node/no-missing-import */
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-watcher";
import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

const NODE_URI_ = process.env.NODE_URI_ || "1".repeat(32);
const PRIVATE_KEYS = process.env.PRIVATE_KEYS || "1".repeat(32);

const chainIds = {
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  binance: 97,
  ropsten: 3,
};

const config: HardhatUserConfig | any = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: !!process.env.REPORT_GAS,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      // accounts: {
      //   mnemonic,
      // },
      chainId: chainIds.hardhat,
    },
    localhost: {
      chainId: 31337,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // goerli: getChainConfig("goerli"),
    binance: { accounts: [PRIVATE_KEYS], url: NODE_URI_ },
    // matic: { accounts: [privatePolygonKey], url: polygonNodeUrl },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEYS],
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEYS],
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  tracer: {
    enableAllOpcodes: true,
  },
  solidity: {
    version: "0.8.16",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      viaIR: true,
    },
  },
  typechain: {
    outDir: "typechain/types",
    target: "ethers-v5",
  },
  watcher: {
    compilation: {
      tasks: ["test"],
    },
  },
};

export default config;
