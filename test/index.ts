import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Sytemap contract", function () {
  let owner: SignerWithAddress;
  let sytemapInstance: any;
  let Sytemap;
  const URI = "ipfs://QmdnfzqwRuTmZwquauTxGs9hXzMaaVczmuSuQbpUU4pRnu";
  const WALLET_ADDRESS = "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E";
  const propertyInfo = {
    plotNo: 2,
    tokenURL: URI,
    estateName: "Lagos",
    priceOfPlot: 3,
    sizeOfPlot: 5,
    plotUrl: "gggg",
    dateOfAllocation: "gggg",
    coordinateOfPlot: 5,
    buyerWalletId: WALLET_ADDRESS,
    estateCompanyName: "ffff",
    propertyVerificationNo: 46,
  };
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    Sytemap = await ethers.getContractFactory("SytemapAssetRegistry");
    sytemapInstance = await Sytemap.deploy(URI);
  });

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
      );
      const txReceipt = await txResponse.wait();
      const event = txReceipt.events.find((event: any) => event.event === "NewPropertyInfoAdded");
      const [
        plotNo,
        tokenURL,
        estateName,
        priceOfPlot,
        sizeOfPlot,
        plotUrl,
        dateOfAllocation,
        coordinateOfPlot,
        buyerWalletId,
        estateCompanyName,
        propertyVerificationNo,
        timestamp,
      ] = event.args;
      const res = {
        plotNo: plotNo.toNumber(),
        tokenURL: tokenURL,
        estateName: estateName,
        priceOfPlot: priceOfPlot.toNumber(),
        sizeOfPlot: sizeOfPlot.toNumber(),
        plotUrl: plotUrl,
        dateOfAllocation: dateOfAllocation,
        coordinateOfPlot: coordinateOfPlot.toNumber(),
        buyerWalletId: buyerWalletId,
        estateCompanyName: estateCompanyName,
        propertyVerificationNo: propertyVerificationNo.toNumber(),
        timestamp: timestamp.toNumber(),
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
