// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/ISytemapAssetRegistry.sol";

/**
 * @title SytemapAssetRegistry
 * @author Aroh Sunday, 2023
 * @notice Allow a user to register an asset (ERC20 | ERC721 | ERC1155) via a simple NFT transfer.
 * This contract is based on the EIP-3589: https://eips.ethereum.org/EIPS/eip-3589
 */

contract SytemapAssetRegistry is
    ISytemapAssetRegistry,
    ERC721,
    Ownable,
    ERC721URIStorage,
    IERC721Enumerable,
    ReentrancyGuard
{
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using Counters for Counters.Counter;

    /*************** State attributes ***************/

    /**
     * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private baseTokenURI;

    /**
     * @notice The name of the token.
     * @return Sytemap coin
     */
    string public constant SYTEMAP_NAME = "Sytemap Coin";
    /**
     * @notice The symbol of the token.
     * @return Stmsp
     */
    string public constant SYTEMAP_SYMBOL = "STYE";

    Counters.Counter private _tokenIdTracker;

    /*********************** Mapping *******************/

    /**
     * @dev mapping from property's token id to property's info
     * @notice is one to many mapping, meaning that a single property could have more that one asset
     */
    mapping(uint256 => PropertyInffo) private _pvnToPropertInfo;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping(address => EnumerableSet.UintSet) private _holderTokens;

    // Enumerable mapping from token ids to their owners
    EnumerableMap.UintToAddressMap private _tokenOwners;

    // Mapping  property verification number to token ID
    mapping(uint256 => uint256) private _propertyVerificationNumberToTokenId;

    /*********************** Constructor *******************/

    /**
     * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
     * name in our case is `Sytemap Coin` and symbol is `STYE`.
     * Constructor for Sytemap Coin takes in the baseURI to set _baseTokenURI for the collection.
     */
    constructor(string memory baseURI) ERC721(SYTEMAP_NAME, SYTEMAP_SYMBOL) {
        setBaseURI(baseURI);
    }

    // ============ FUNCTION OVERRIDES ============

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

/**
     * @dev This help us to change the base url even when the contract has been deployed.
     */
    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 _tokenId) public view override(ERC721, IERC721) returns (address) {
        return _tokenOwners.get(_tokenId, "ERC721: owner query for nonexistent token");
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view override(ERC721, IERC721) returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");

        return _holderTokens[owner].length();
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256) {
        require(index < balanceOf(owner), "Index out of bounds");
        return _holderTokens[owner].at(index);
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view override returns (uint256) {
        // _tokenOwners are indexed by tokenIDs, so .length() returns the number of tokenIDs
        return _tokenOwners.length();
    }

    function tokenURI(uint256 _propertyVerificationNo)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
         require(_exists(_propertyVerificationNo), "ERC721URIStorage: URI query for nonexistent token");
        return super.tokenURI(_propertyVerificationNo);
    }

    function tokenByIndex(uint256 index) public view override returns (uint256) {
        require(index < totalSupply(), "ERC721Enumerable: invalid index");
        return index + 1;
    }

    /*********************** External methods *******************/

    /**
     * @dev Creates a new NFT and mints it to the caller of the function.
     * @param _plotNo The plot number.
     * @param _tokenURL The token url where the asset is upload on ipfs ie the CID
     * @param _estateName The estate name the plot is located
     * @param _priceOfPlot The price of the plot
     * @param _sizeOfPlot The size of the plot
     * @param _plotUrl The plot url
     * @param _dateOfAllocation The date of allocation for the plot
     * @param _coordinateOfPlot The coordinates of the plot
     * @param _buyerWalletId The buyer wallet id
     * @param _estateCompanyName The estate company name registering the asset
     * @param _propertyVerificationNo The property verification No for any asset
     */
    function safeMintNewPropertyInfo(
        uint256 _plotNo,
        string memory _tokenURL,
        string memory _estateName,
        uint256 _priceOfPlot,
        uint256 _sizeOfPlot,
        string memory _plotUrl,
        string memory _dateOfAllocation,
        uint256 _coordinateOfPlot,
        address _buyerWalletId,
        string memory _estateCompanyName,
        uint256 _propertyVerificationNo
    ) external payable onlyOwner nonReentrant {
        // require(!isProductVerificationNoExist(_propertyVerificationNo), "Token URI already exists");
        require(!_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token already minted");
        require(_buyerWalletId != address(0), "ERC721: invalid address");
        require(_buyerWalletId != address(this), "ERC721: invalid address");
        _tokenIdTracker.increment();
        uint256 tokenId = _tokenIdTracker.current();
        // Mint token directly to buyer
        _safeMint(_buyerWalletId, _propertyVerificationNo);
        // Set the tokens metadata
        _setTokenURI(_propertyVerificationNo, _tokenURL);
        // Update state variables to reflect minted token
        _addPropertyTokenToOwnerEnumeration(_buyerWalletId, tokenId);
        _addPropertyTokenToHolderEnumeration(_buyerWalletId, tokenId);
        _mapPropertyVerificationNumberToTokenId(tokenId, _propertyVerificationNo); // generate token id from counter

        // Set the land property details for the token
        _addNewPropertyInfo(
            _plotNo,
            _tokenURL,
            _estateName,
            _priceOfPlot,
            _sizeOfPlot,
            _plotUrl,
            _dateOfAllocation,
            _coordinateOfPlot,
            _buyerWalletId,
            _estateCompanyName,
            _propertyVerificationNo,
            tokenId
        );
        emit TokenMinted(tokenId, _propertyVerificationNo, _tokenURL);
    }

    /// @dev Function to change property value
    /// @param _propertyVerificationNo Identifier for property
    /// @param _priceOfPlot New Property Price
    function changePropertyPriceByOwner(
        uint256 _propertyVerificationNo,
        uint256 _priceOfPlot
    ) external onlyOwner returns (bool) {
        require(_priceOfPlot > 0, "Plot Price must be greater than 0.");
        require(msg.sender != address(0), "ERC721: invalid address");
        require(_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token does not exist or not been minted");

        uint256 tokenId = _propertyNumberToTokenId(_propertyVerificationNo);
        _pvnToPropertInfo[tokenId].priceOfPlot = _priceOfPlot;

        emit PropertyInfoPriceChanged(msg.sender, _propertyVerificationNo, _priceOfPlot);

        return true;
    }

    /// @notice gets the a particular property info by their pvn
    function getPropertyInfoDetailsByPVN(uint256 _propertyVerificationNo) external view returns (PropertyInffo memory) {
        require(_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token does not exist or not been minted");
        uint256 tokenId = _propertyNumberToTokenId(_propertyVerificationNo);
        return _pvnToPropertInfo[tokenId];
    }

    // get total number of oroperty tokens owned by an address
    function getTotalNumberOfPropertyOwnedByAnAddress(address _owner) external view returns (uint256) {
        require(msg.sender != address(0));
        uint256 totalNumberOfTokensOwned = balanceOf(_owner);
        return totalNumberOfTokensOwned;
    }

    // get total number of tokens minted so far
    function getNumberOfPropertyTokensMinted() external view returns (uint256) {
        uint256 totalNumberOfTokensMinted = totalSupply();
        return totalNumberOfTokensMinted;
    }

    // get owner of a property verufucatio no
    function getPropertyVerificationNoOwner(uint256 _propertyVerificationNo) external view returns (address) {
        uint256 tokenId = _propertyNumberToTokenId(_propertyVerificationNo);
        address _tokenOwner = ownerOf(tokenId);
        return _tokenOwner;
    }

    function getAllPropertyDetailsByOwner(address owner) external view returns (PropertyInffo[] memory) {
        uint256 tokenCount = balanceOf(owner);
        PropertyInffo[] memory propertyDetailsList = new PropertyInffo[](tokenCount);

        for (uint256 i = 0; i < tokenCount; ) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            propertyDetailsList[i] = _pvnToPropertInfo[tokenId];

            unchecked {
                ++i;
            }
        }

        return propertyDetailsList;
    }

    function getAllMintedPropertyDetails() external view returns (PropertyInffo[] memory) {
        uint256 totalProperties = _tokenIdTracker.current();
        PropertyInffo[] memory allDetails = new PropertyInffo[](totalProperties);
        for (uint256 i = 0; i < totalProperties; ) {
            uint256 tokenId = tokenByIndex(i);
            allDetails[i] = _pvnToPropertInfo[tokenId];

            unchecked {
                ++i;
            }
        }
        return allDetails;
    }

    /*********************** Internal methods *******************/

    /**
     * @dev Function to register property details.
     * @param _plotNo The plot number.
     * @param _tokenURL The token url where the asset is upload on ipfs ie the CID
     * @param _estateName The estate name the plot is located
     * @param _priceOfPlot The price of the plot
     * @param _sizeOfPlot The size of the plot
     * @param _plotUrl The plot url
     * @param _dateOfAllocation The date of allocation for the plot
     * @param _coordinateOfPlot The coordinates of the plot
     * @param _buyerWalletId The buyer wallet id
     * @param _estateCompanyName The estate company name registering the asset
     * @param _propertyVerificationNo The property verification No for any asset
     */
    function _addNewPropertyInfo(
        uint256 _plotNo,
        string memory _tokenURL,
        string memory _estateName,
        uint256 _priceOfPlot,
        uint256 _sizeOfPlot,
        string memory _plotUrl,
        string memory _dateOfAllocation,
        uint256 _coordinateOfPlot,
        address _buyerWalletId,
        string memory _estateCompanyName,
        uint256 _propertyVerificationNo,
        uint256 _tokenId
    ) internal {
        require(_priceOfPlot > 0, "Price must be at least 1 wei");
        require(_buyerWalletId != address(0), "ERC721: mint to the zero address");
        require(bytes(_tokenURL).length > 0, "Token url is  empty");

        // check if the token URI already exists or not
        //    require(!tokenURIExists[_tokenURL], "Token url already e");
        PropertyInffo memory propertyInffo = PropertyInffo({
            plotNo: _plotNo,
            tokenURL: _tokenURL,
            estateName: _estateName,
            priceOfPlot: _priceOfPlot,
            sizeOfPlot: _sizeOfPlot,
            plotUrl: _plotUrl,
            dateOfAllocation: _dateOfAllocation,
            coordinateOfPlot: _coordinateOfPlot,
            buyerWalletId: _buyerWalletId,
            estateCompanyName: _estateCompanyName,
            propertyVerificationNo: _propertyVerificationNo,
            timestamp: block.timestamp
        });
        _pvnToPropertInfo[_tokenId] = propertyInffo;

        emit NewPropertyInfoAdded(
            _plotNo,
            _tokenURL,
            _estateName,
            _priceOfPlot,
            _sizeOfPlot,
            _plotUrl,
            _dateOfAllocation,
            _coordinateOfPlot,
            _buyerWalletId,
            _estateCompanyName,
            _propertyVerificationNo,
            _tokenId,
            block.timestamp
        );
    }

    /**
     * @dev Returns whether `tokenID` exists.
     *
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _checkPvnExists(uint256 _propertyVerificationNo) internal view returns (bool) {
        uint256 tokenID = _propertyNumberToTokenId(_propertyVerificationNo);
        return _tokenOwners.contains(tokenID);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param _buyerWalletId address representing the new owner of the given token ID
     * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addPropertyTokenToOwnerEnumeration(address _buyerWalletId, uint256 _tokenId) private {
        _tokenOwners.set(_tokenId, _buyerWalletId);
    }

    /**
     * @dev Private function to add a token to this extension's holder-tracking data structures.
     * @param _buyerWalletId address representing the new owner of the given token ID
     * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addPropertyTokenToHolderEnumeration(address _buyerWalletId, uint256 _tokenId) private {
        _holderTokens[_buyerWalletId].add(_tokenId);
    }

    /**
     * @dev Private function to map a token to this pvn .
     * @param _tokenId token id representing the new owner of the given token ID
     * @param _propertyVerificationNo uint256 ID of the token to be added to the tokens list of the given address
     */
    function _mapPropertyVerificationNumberToTokenId(uint256 _tokenId, uint256 _propertyVerificationNo) private {
        _propertyVerificationNumberToTokenId[_propertyVerificationNo] = _tokenId;
    }

    function _propertyNumberToTokenId(uint256 _propertyVerificationNo) internal view returns (uint256) {
        return _propertyVerificationNumberToTokenId[_propertyVerificationNo];
    }
}
