import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const baseTokenURI = "ipfs://QmZbWNKJPAjxXuNFSEaksCJVd1M6DaKQViJBYPK2BdpDEP/";

  const Sytemap = await ethers.getContractFactory("SytemapAssetRegistry");
  const sytemapNft = await Sytemap.deploy("hthhhhhhhhhhhhh");

  await sytemapNft.deployed();

  console.log(
    `Contract deployed with Base Url ${baseTokenURI}ETH and timestamp ${unlockTime} deployed to ${sytemapNft.address}`,
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
