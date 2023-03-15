/* eslint-disable node/no-missing-import */
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/config";
import * as env from "./utils/env";
import { NetworksUserConfig } from "hardhat/types";
const polygonNodeUrl = "https://polygon-mumbai.g.alchemy.com/v2/mhubXm17W27tcT-Sw6Lmpmrc2Mmq3Sgb";
const privatePolygonKey = "38bf8d751f731a2922c7aacbed07c4d3d26893f42ca4cf4f7d5d259633f3e267";

const chainIds = {
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  binance: 97,
  ropsten: 3,
};

function getChainConfig(network: string) {
  return {
    url: env.getNodeUrl(`${String(network)}`),
    accounts: env.getAccounts(`${String(network)}`),
  } as NetworksUserConfig | any;
}

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
    goerli: getChainConfig("goerli"),
    binance: getChainConfig("binance"),
    matic: { accounts: [privatePolygonKey], url: polygonNodeUrl },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.9",
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
    },
  },
  typechain: {
    outDir: "typechain/types",
    target: "ethers-v5",
  },
};

export default config;
