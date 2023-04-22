/* eslint-disable no-process-exit */
import { ethers, upgrades } from "hardhat";

// const CONTRACT_ADDRESS: string = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const PROXY_ADDRESS = "0xD1a7c6f15ecC1ceD1219CDa8F556026ADB2063ad"; // Address of version 1
// const VERSION1 = "0x35C9fC0433A007E85E1df9339916F703D2c7512F"; //Address of the version 1 implementation

async function main() {
  // We get the contract to deploy
  const SytemapAssetRegistryUpgradeableV2 = await ethers.getContractFactory("SytemapAssetRegistry");
  const contract = await upgrades.upgradeProxy(PROXY_ADDRESS, SytemapAssetRegistryUpgradeableV2, {
    call: { fn: "reInitialize" },
    kind: "uups",
  });

  console.log("Contract Upgraded", contract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
