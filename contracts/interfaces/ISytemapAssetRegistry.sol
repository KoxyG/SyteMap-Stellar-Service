// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

/*********************** Interface Definition *******************/

/**
 * @dev Interface of the Sytemap asset registry nft attribute.
 */
interface ISytemapAssetRegistry {
    struct PropertyInffo {
        uint256 plotNo;
        uint256 priceOfPlot;
        uint256 sizeOfPlot;
        uint256 coordinateOfPlot;
        uint256 propertyVerificationNo;
        uint256 timestamp;
        address buyerWalletId;
        string tokenURL;
        string estateName;
        string plotUrl;
        string dateOfAllocation;
        string estateCompanyName;
    }

    /*********************** Events *******************/

    /**
     * @notice Emitted when a new property NFT is minted.
     * @param plotNo The plotno of the collection owner at this time this property NFT was minted.
     * @param tokenURL The tokenURL of the newly minted property NFT, indexed to enable watching for mint events by the tokenurl.
     * @param estateName The estateName of the newly minted property NFT, 
     * @param priceOfPlot The actual price of the plot of the newly minted property NFT.
     * @param sizeOfPlot The size of plot of the newly minted property NFT, 
     * @param plotUrl The plot url of the newly minted property NFT, 
     * @param dateOfAllocation The date of allocation of the newly minted property NFT, 
     * @param coordinateOfPlot The coordinate point of the newly minted property NFT, 
     * @param buyerWalletId The owner address of the property at this time this property NFT was minted.
     * @param estateCompanyName The estate company of the newly minted property NFT, 
     * @param propertyVerificationNo The property verification number of the newly minted property NFT, 
     * @param timestamp The actual time of the newly minted property NFT, 

     */
    event NewPropertyInfoAdded(
        uint256 plotNo,
        string indexed tokenURL,
        string estateName,
        uint256 priceOfPlot,
        uint256 sizeOfPlot,
        string plotUrl,
        string dateOfAllocation,
        uint256 coordinateOfPlot,
        address buyerWalletId,
        string estateCompanyName,
        uint256 propertyVerificationNo,
        uint256 tokenId,
        uint256 timestamp
    );

    event TokenMinted(uint256 indexed tokenId, uint256 indexed propertyVerificationNo, string tokenURL);

    /**
     * @notice Emitted when a property price is changed by owner
     * @param owner The owner of the minted property nft.
     * @param newPrice The new price of the property.
     */
    event PropertyInfoPriceChanged(address owner, uint256 propertyVerificationNo, uint256 newPrice);

    /*********************** Interface Methods  *******************/

    function safeMintNewPropertyInfo(
        uint256 plotNo,
        string memory tokenURL,
        string memory estateName,
        uint256 priceOfPlot,
        uint256 sizeOfPlot,
        string memory plotUrl,
        string memory dateOfAllocation,
        uint256 coordinateOfPlot,
        address buyerWalletId,
        string memory estateCompanyName,
        uint256 propertyVerificationNo
    ) external payable;

    function changePropertyPriceByOwner(uint256 _propId, uint256 _newPrice) external returns (bool);

    function getTotalNumberOfPropertyOwnedByAnAddress(address _owner) external view returns (uint256);

    function getNumberOfPropertyTokensMinted() external view returns (uint256);

    function getAllMintedPropertyDetails() external view returns (PropertyInffo[] memory);
}
