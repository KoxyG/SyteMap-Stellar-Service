// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

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

    /*************** State attributes ***************/

    /**
     * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private _baseTokenURI;

    /**
     * @notice The name of the token.
     * @return Sytemap coin
     */
    string public constant _sytemapName = "Sytemap Coin";
    /**
     * @notice The symbol of the token.
     * @return Stmsp
     */
    string public constant _sytemapSymbol = "STYE";

    /*********************** Mapping *******************/

    /**
     * @dev mapping from property's token id to property's info
     * @notice is one to many mapping, meaning that a single property could have more that one asset
     */
    mapping(uint256 => PropertyInffo) public _pvnToPropertInfo;

    /**
     * @dev mapping from tokentId to tokenUri
     */
    mapping(uint256 => string) private _tokenURIs;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping(address => EnumerableSet.UintSet) private _holderTokens;

    // Enumerable mapping from token ids to their owners
    EnumerableMap.UintToAddressMap private _tokenOwners;

    /*********************** Constructor *******************/

    /**
     * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
     * name in our case is `Sytemap Coin` and symbol is `STYE`.
     * Constructor for Sytemap Coin takes in the baseURI to set _baseTokenURI for the collection.
     */
    constructor(string memory baseURI) ERC721(_sytemapName, _sytemapSymbol) {
        _baseTokenURI = baseURI;
    }

    /*********************** External methods *******************/

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 propertyVerificationNo) public view override(ERC721, IERC721) returns (address) {
        return _tokenOwners.get(propertyVerificationNo, "ERC721: owner query for nonexistent token");
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
        return _holderTokens[owner].at(index);
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view override returns (uint256) {
        (uint256 tokenID, ) = _tokenOwners.at(index);
        return tokenID;
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view override returns (uint256) {
        // _tokenOwners are indexed by tokenIDs, so .length() returns the number of tokenIDs
        return _tokenOwners.length();
    }

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
    ) public payable onlyOwner nonReentrant {
        // require(!isProductVerificationNoExist(_propertyVerificationNo), "Token URI already exists");
        require(!_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token already minted");

        // Mint token directly to buyer
        _safeMint(_buyerWalletId, _propertyVerificationNo);
        // Set the tokens metadata
        _setTokenURI(_propertyVerificationNo, _tokenURL);
        // Store creator of the property
        _tokenOwners.set(_propertyVerificationNo, _buyerWalletId);
        _holderTokens[_buyerWalletId].add(_propertyVerificationNo);
        // Add to Storage data
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
            _propertyVerificationNo
        );
        emit TokenMinted(_buyerWalletId, _propertyVerificationNo, _tokenURL);
    }

    /// @dev Function to change property value
    /// @param _propertyVerificationNo Identifier for property
    /// @param _priceOfPlot New Property Price
    function changePropertyPriceByOwner(
        uint256 _propertyVerificationNo,
        uint256 _priceOfPlot
    ) external onlyOwner returns (bool) {
        require(_priceOfPlot > 0, "Plot Price must be greater than 0.");
        require(msg.sender != address(0));
        require(_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token does not exist or not been minted");

        _pvnToPropertInfo[_propertyVerificationNo].priceOfPlot = _priceOfPlot;

        emit PropertyInfoPriceChanged(msg.sender, _propertyVerificationNo, _priceOfPlot);

        return true;
    }

    /// @notice gets the a particular property info by their pvn
    function getPropertyInfoDetails(uint256 _propertyVerificationNo) public view returns (PropertyInffo memory) {
        require(_checkPvnExists(_propertyVerificationNo), "ERC721: pvn token does not exist or not been minted");
        return _pvnToPropertInfo[_propertyVerificationNo];
    }

    // get total number of oroperty tokens owned by an address
    function getTotalNumberOfPropertyOwnedByAnAddress(address _owner) public view returns (uint256) {
        require(msg.sender != address(0));
        uint256 totalNumberOfTokensOwned = balanceOf(_owner);
        return totalNumberOfTokensOwned;
    }

    // get total number of tokens minted so far
    function getNumberOfPropertyTokensMinted() public view returns (uint256) {
        uint256 totalNumberOfTokensMinted = totalSupply();
        return totalNumberOfTokensMinted;
    }

    // get owner of a property verufucatio no
    function getPropertyVerificationNoOwner(uint256 _propertyVerificationNo) public view returns (address) {
        address _tokenOwner = ownerOf(_propertyVerificationNo);
        return _tokenOwner;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "URI query of nonexistent token");
        return _tokenURIs[tokenId];
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
        uint256 _propertyVerificationNo
    ) internal {
        require(_priceOfPlot > 0, "Price must be at least 1 wei");
        require(_buyerWalletId != address(0), "ERC721: mint to the zero address");

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
        _pvnToPropertInfo[_propertyVerificationNo] = propertyInffo;

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
    function _checkPvnExists(uint256 tokenID) internal view returns (bool) {
        return _tokenOwners.contains(tokenID);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
