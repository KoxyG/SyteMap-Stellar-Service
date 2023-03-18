const { ethers, upgrades } = require("hardhat");

// Using the Openzeppelin’s Transparent Upgradeable proxy.
async function main() {
  const gas = await ethers.provider.getGasPrice();
  const V1contract = await ethers.getContractFactory("SytemapAssetRegistry");
  console.log("Deploying V1contract...");
  const v1contract = await upgrades.deployProxy(V1contract, [10], {
    gasPrice: gas,
    initializer: "initialvalue",
  });
  await v1contract.deployed();
  console.log("V1 Contract deployed to:", v1contract.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
