/* eslint-disable no-process-exit */
import { ethers, upgrades } from "hardhat";

const CONTRACT_ADDRESS: string = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  // We get the contract to deploy
  const SytemapAssetRegistryUpgradeableV2 = await ethers.getContractFactory("SytemapAssetRegistry");
  const contract = await upgrades.upgradeProxy(CONTRACT_ADDRESS, SytemapAssetRegistryUpgradeableV2);

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
