import { ethers, upgrades } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const URI: any = "sytemap-ipfs-dev-server.sytemap.com";

  const Sytemap = await ethers.getContractFactory("SytemapAssetRegistry");
  // const sytemapNft = await Sytemap.deploy("hthhhhhhhhhhhhh");
  const sytemapInstance = await upgrades.deployProxy(Sytemap, [URI], {
    initializer: "initialize",
    kind: "uups",
  });

  await sytemapInstance.deployed();

  console.log(
    `Contract deployed with Base Url ${URI}ETH and timestamp ${unlockTime} deployed to ${sytemapInstance.address}`,
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
