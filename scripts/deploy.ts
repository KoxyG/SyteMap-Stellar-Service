import { ethers, upgrades } from "hardhat";

async function main() {
  const URI: any = "sytemap-ipfs-dev-server.sytemap.com";
  const Sytemap = await ethers.getContractFactory("SytemapAssetRegistry");
  const sytemapInstanceProxy = await upgrades.deployProxy(Sytemap, [URI], {
    initializer: "initialize",
    kind: "uups",
  });

  await sytemapInstanceProxy.deployed();

  const implementationV1Address = await upgrades.erc1967.getImplementationAddress(sytemapInstanceProxy.address);

  console.log("proxy deployed to:", sytemapInstanceProxy.address);

  console.log("ImplementationV1 contract address: " + implementationV1Address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
