import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Sytemap contract", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let sytemapInstance: any;
  let Sytemap;
  const URI = "sytemap-ipfs-dev-server.sytemap.com/";
  const tokenUrl = "ipfs//QmdnfzqwRuTmZwquauTxGs9hXzMaaVczmuSuQbpUU4pRnu";
  const WALLET_ADDRESS = "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E";
  const propertyInfo = {
    plotNo: "Plot B3 julia bingma",
    tokenURL: "ipfs://QmdnfzqwRuTmZwquauTxGs9hXzMaaVczmuSuQbpUU4pRnu",
    estateName: "Lagos",
    priceOfPlot: 3000000000.0,
    sizeOfPlot: "50SQM",
    plotUrl: "https://developer.sytemap.com/map/property-map",
    dateOfAllocation: "2023-03-21",
    coordinateOfPlot: "this is so many of the json file added to the contract",
    buyerWalletId: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    estateCompanyName: "Lagos estate",
    propertyVerificationNo: 46,
    nftAddress: "0xdddddfsgerrh",
  };
  beforeEach(async () => {
    // [owner] = await ethers.getSigners();
    [owner, addr1] = await ethers.getSigners();

    Sytemap = await ethers.getContractFactory("SytemapAssetRegistry");
    sytemapInstance = await upgrades.deployProxy(Sytemap, [URI], {
      initializer: "initialize",
      kind: "uups",
    });
  });

  console.log({ Sytemap, sytemapInstance });

  describe("Deployment", () => {
    const _name = "Sytemap Coin";
    const _symbol = "STYE";
    it("Should have the correct name and symbol", async function () {
      expect(await sytemapInstance.name()).to.equal(_name);
      expect(await sytemapInstance.symbol()).to.equal(_symbol);
    });
    it("should set the right owner", async function () {
      expect(await sytemapInstance.owner()).to.equal(owner.address);
    });
  });
  describe("Minting", function () {
    it("Should mint the property info", async function () {
      const txResponse = await sytemapInstance.safeMintNewPropertyInfo(
        propertyInfo.plotNo,
        propertyInfo.tokenURL,
        propertyInfo.estateName,
        propertyInfo.priceOfPlot,
        propertyInfo.sizeOfPlot,
        propertyInfo.plotUrl,
        propertyInfo.dateOfAllocation,
        propertyInfo.coordinateOfPlot,
        propertyInfo.buyerWalletId,
        propertyInfo.estateCompanyName,
        propertyInfo.propertyVerificationNo,
        propertyInfo.nftAddress,
      );
      const txReceipt = await txResponse.wait();
      const event = txReceipt.events.find((event: any) => event.event === "NewPropertyInfoAdded");
      const [
        plotNo,
        propertyVerificationNo,
        timestamp,
        priceOfPlot,
        buyerWalletId,
        tokenURL,
        estateName,
        sizeOfPlot,
        plotUrl,
        dateOfAllocation,
        coordinateOfPlot,
        estateCompanyName,
      ] = event.args;
      const res = {
        plotNo: plotNo,
        tokenURL: tokenURL,
        estateName: estateName,
        priceOfPlot: priceOfPlot,
        sizeOfPlot: sizeOfPlot,
        plotUrl: plotUrl,
        dateOfAllocation: dateOfAllocation,
        coordinateOfPlot: coordinateOfPlot,
        buyerWalletId: buyerWalletId,
        estateCompanyName: estateCompanyName,
        propertyVerificationNo: propertyVerificationNo,
        timestamp: timestamp,
      };

      expect(res.propertyVerificationNo).to.equal(propertyInfo.propertyVerificationNo);
    });
    //   it("Should check NewPropertyInfoAdded event is emitted ", async () => {
    //     const txResponse = await sytemapInstance.safeMintNewPropertyInfo(
    //       propertyInfo.plotNo,
    //       propertyInfo.tokenURL,
    //       propertyInfo.estateName,
    //       propertyInfo.priceOfPlot,
    //       propertyInfo.sizeOfPlot,
    //       propertyInfo.plotUrl,
    //       propertyInfo.dateOfAllocation,
    //       propertyInfo.coordinateOfPlot,
    //       propertyInfo.buyerWalletId,
    //       propertyInfo.estateCompanyName,
    //       propertyInfo.propertyVerificationNo,
    //     );
    //     await expect(txResponse)
    //       .to.emit(sytemapInstance, "NewPropertyInfoAdded")
    //       .withArgs(
    //         propertyInfo.plotNo,
    //         propertyInfo.tokenURL,
    //         propertyInfo.estateName,
    //         propertyInfo.priceOfPlot,
    //         propertyInfo.sizeOfPlot,
    //         propertyInfo.plotUrl,
    //         propertyInfo.dateOfAllocation,
    //         propertyInfo.coordinateOfPlot,
    //         propertyInfo.buyerWalletId,
    //         propertyInfo.estateCompanyName,
    //         propertyInfo.propertyVerificationNo,
    //         1678888859,
    //       );
    //   });
    //   it("Should check Mint event is emitted ", async () => {
    //     const txResponse = await sytemapInstance.safeMintNewPropertyInfo(
    //       propertyInfo.plotNo,
    //       propertyInfo.tokenURL,
    //       propertyInfo.estateName,
    //       propertyInfo.priceOfPlot,
    //       propertyInfo.sizeOfPlot,
    //       propertyInfo.plotUrl,
    //       propertyInfo.dateOfAllocation,
    //       propertyInfo.coordinateOfPlot,
    //       propertyInfo.buyerWalletId,
    //       propertyInfo.estateCompanyName,
    //       propertyInfo.propertyVerificationNo,
    //     );
    //     await expect(txResponse)
    //       .to.emit(sytemapInstance, "TokenMinted")
    //       .withArgs(propertyInfo.buyerWalletId, propertyInfo.propertyVerificationNo, propertyInfo.tokenURL);
    //   });
    // });
    // describe("Get Property Asset info", function () {
    //   it("Should revert when property verification no is already used", async () => {
    //     const propertyVerificationNo = propertyInfo.propertyVerificationNo;
    //     const reason = "Property Verification Number already exist";
    //     await expect(sytemapInstance.getPropertyInfoDetails(propertyVerificationNo)).to.be.revertedWith(`${reason}`);
    //   });
    //   it("Should get the property details by pvn", async function () {
    //     const propertyVerificationNo = propertyInfo.propertyVerificationNo;
    //     const tx = await sytemapInstance.getPropertyInfoDetails(propertyVerificationNo);
    //     console.log({ tx });
    //     expect(tx.propertyVerificationNo.toNumber()).to.equal(propertyVerificationNo);
    //   });
  });
});
