// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./utils/ERC721AUpgradeable.sol";
import "./utils/ERC721ABurnableUpgradeable.sol";
import "./utils/ERC721AQueryableUpgradeable.sol";
import "./utils/filters/DefaultOperatorFiltererUpgradeable.sol";
import "./utils/abstracts/TeamMembersUpgradeable.sol";

import "./interfaces/INFTArtGen.sol";

contract NFTArtGenUpgradeable is
  Initializable,
  IERC2981,
  ERC721AUpgradeable,
  ERC721ABurnableUpgradeable,
  ERC721AQueryableUpgradeable,
  TeamMembersUpgradeable,
  DefaultOperatorFiltererUpgradeable,
  INFTArtGen
{
  using AddressUpgradeable for address;
  using StringsUpgradeable for uint256;
  using MathUpgradeable for uint256;
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

  uint32 public maxPerMint;
  uint32 public maxPerWallet;
  uint32 public maxFreeMint;
  uint256 public pauseMintAt;
  uint256 public cost;
  bool public open;
  bool public revealed;
  bool public presaleOpen;
  bool public referralOpen;
  uint256 public referralCap;
  address public reqToken;
  uint256 internal maxSupply;
  string internal baseUri;
  address internal recipient;
  uint256 internal recipientFee;
  string internal uriNotRevealed;
  bytes32 private merkleRoot;
  mapping(address => uint256) private referralMap;
  mapping(address => uint256) private _freeMints;
  address private constant _NFTGen = 0x460Fd5059E7301680fA53E63bbBF7272E643e89C;
  mapping(address => uint256) private _shares;
  address[] private _payees;

  function __NFTArtGen_init(
    string memory _name,
    string memory _symbol,
    uint256 _maxSupply,
    uint256 _commission
  ) internal onlyInitializing {
    __ERC721A_init(_name, _symbol);
    __ERC721ABurnable_init();
    __ERC721AQueryable_init();
    __Ownable_init();
    __DefaultOperatorFilterer_init();
    maxSupply = _maxSupply;
    revealed = false;

    _shares[_NFTGen] = _commission;
    _shares[owner()] = 1000 - _commission;
    _payees.push(_NFTGen);
    _payees.push(owner());
  }

  // ------ Dev Only ------

  function setCommission(uint256 _val1) external override {
    require(msg.sender == _NFTGen, "Invalid address");
    uint256 diff = _shares[_NFTGen] - _val1;
    _shares[_NFTGen] = _val1;
    _shares[_payees[1]] += diff;
  }

  // ------ Owner Only ------

  function updateSale(
    bool _open,
    uint256 _cost,
    uint32 _maxW,
    uint32 _maxM
  ) external override onlyTeamOrOwner {
    open = _open;
    cost = _cost;
    maxPerWallet = _maxW;
    maxPerMint = _maxM;
  }

  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }

  function updateReqToken(address _address) external override onlyTeamOrOwner {
    reqToken = _address;
  }

  function updatePresale(bool _open, bytes32 root)
    external
    override
    onlyTeamOrOwner
  {
    presaleOpen = _open;
    merkleRoot = root;
  }

  function updateReveal(bool _revealed, string memory _uri)
    external
    override
    onlyTeamOrOwner
  {
    revealed = _revealed;

    if (_revealed == false) {
      uriNotRevealed = _uri;
    }

    if (_revealed == true) {
      bytes memory b1 = bytes(baseUri);
      if (b1.length == 0) {
        baseUri = _uri;
      }
    }
  }

  function updateMaxFreeMint(uint32 _cap) external override onlyTeamOrOwner {
    maxFreeMint = _cap;
  }

  function updatePauseMintAt(uint256 _pauseAt)
    external
    override
    onlyTeamOrOwner
  {
    require(_pauseAt >= supply(), "Invalid value");
    pauseMintAt = _pauseAt;
  }

  function updateBaseUri(string memory _uri) external override onlyTeamOrOwner {
    baseUri = _uri;
  }

  function updateWithdrawSplit(
    address[] memory _addresses,
    uint256[] memory _fees
  ) external override onlyOwner {
    for (uint256 i = 1; i < _payees.length; i++) {
      delete _shares[_payees[i]];
    }
    _payees = new address[](_addresses.length + 1);
    _payees[0] = _NFTGen;

    for (uint256 i = 0; i < _addresses.length; i++) {
      _shares[_addresses[i]] = _fees[i];
      _payees[i + 1] = _addresses[i];
    }
  }

  function getWithdrawSplit()
    external
    view
    override
    returns (address[] memory, uint256[] memory)
  {
    uint256[] memory values = new uint256[](_payees.length);

    for (uint256 i = 0; i < _payees.length; i++) {
      values[i] = _shares[_payees[i]];
    }

    return (_payees, values);
  }

  function updateReferral(bool _open, uint256 _val)
    external
    override
    onlyTeamOrOwner
  {
    referralOpen = _open;
    referralCap = _val;
  }

  function updateRoyalties(address _recipient, uint256 _fee)
    external
    override
    onlyTeamOrOwner
  {
    recipient = _recipient;
    recipientFee = _fee;
  }

  function withdraw() external payable override {
    uint256 balance = address(this).balance;
    require(balance > 0, "Zero balance");

    for (uint256 i = 0; i < _payees.length; i++) {
      uint256 split = _shares[_payees[i]];
      uint256 value = ((split * balance) / 1000);
      AddressUpgradeable.sendValue(payable(_payees[i]), value);
    }
  }

  // ------ Mint! ------
  function airdrop(address[] memory _recipients, uint256[] memory _amount)
    external
    override
    onlyTeamOrOwner
  {
    require(_recipients.length == _amount.length);

    for (uint256 i = 0; i < _amount.length; i++) {
      require(supply() + _amount[i] <= totalSupply(), "reached max supply");
      _safeMint(_recipients[i], _amount[i]);
    }
  }

  function mint(uint256 count)
    external
    payable
    override
    preMintChecks(count, msg.sender)
    postMintChecks
  {
    require(open == true, "Mint not open");
    _safeMint(msg.sender, count);
  }

  function mintTo(uint256 count, address to)
    external
    payable
    override
    preMintChecks(count, to)
    postMintChecks
  {
    require(open == true, "Mint not open");
    _safeMint(to, count);
  }

  function mintAll() external payable override onlyOwner {
    if (msg.value > 0) {
      AddressUpgradeable.sendValue(payable(_NFTGen), msg.value);
    }

    _safeMint(owner(), totalSupply() - supply());
  }

  function presaleMint(uint32 count, bytes32[] calldata proof)
    external
    payable
    override
    preMintChecks(count, msg.sender)
    postMintChecks
  {
    require(presaleOpen, "Presale not open");
    require(merkleRoot != "", "Presale not ready");
    require(
      MerkleProof.verify(
        proof,
        merkleRoot,
        keccak256(abi.encodePacked(msg.sender))
      ),
      "Not a presale member"
    );

    _safeMint(msg.sender, count);
  }

  function presaleMintTo(
    uint32 count,
    bytes32[] calldata proof,
    address to
  ) external payable override preMintChecks(count, to) postMintChecks {
    require(presaleOpen, "Presale not open");
    require(merkleRoot != "", "Presale not ready");
    require(
      MerkleProof.verify(proof, merkleRoot, keccak256(abi.encodePacked(to))),
      "Not a presale member"
    );

    _safeMint(to, count);
  }

  function referralMint(uint32 count, address referrer)
    external
    payable
    override
    preMintChecks(count, msg.sender)
    postMintChecks
  {
    require(referralOpen == true, "Referrals not open");
    require(open == true, "Mint not open");
    require(referralCap > 0, "Cap is set to zero");
    require(_numberMinted(referrer) > 0, "Referrer has not minted");
    require(msg.sender != referrer, "Cannot refer yourself");

    _safeMint(msg.sender, count);

    referralMap[referrer] += 1;
    if (referralMap[referrer] % referralCap == 0) {
      if (supply() < totalSupply()) {
        _safeMint(referrer, 1);
      }
    }
  }

  function referralMintTo(
    uint32 count,
    address referrer,
    address to
  ) external payable override preMintChecks(count, to) postMintChecks {
    require(referralOpen == true, "Referrals not open");
    require(open == true, "Mint not open");
    require(referralCap > 0, "Cap is set to zero");
    require(_numberMinted(referrer) > 0, "Referrer has not minted");
    require(to != referrer, "Cannot refer yourself");

    _safeMint(to, count);

    referralMap[referrer] += 1;
    if (referralMap[referrer] % referralCap == 0) {
      if (supply() < totalSupply()) {
        _safeMint(referrer, 1);
      }
    }
  }

  // ------ Read ------
  function supply() public view override returns (uint256) {
    return _currentIndex - 1;
  }

  function totalSupply()
    public
    view
    override(ERC721AUpgradeable, INFTArtGen)
    returns (uint256)
  {
    return maxSupply - _burnCounter;
  }

  function numberMintedOfOwner(address _address)
    external
    view
    override
    returns (uint256)
  {
    return _numberMinted(_address);
  }

  function remainingMintsOfOwner(address _address)
    external
    view
    override
    returns (uint256)
  {
    return maxPerWallet - _numberMinted(_address);
  }

  function mintCostOfOwner(address _address, uint256 _count)
    public
    view
    override
    returns (uint256)
  {
    uint256 mintedSoFar = _numberMinted(_address);
    if (maxFreeMint > 0 && mintedSoFar > maxFreeMint) {
      return
        cost *
        (_count - MathUpgradeable.min(_count, maxFreeMint - mintedSoFar));
    }

    return _count * cost;
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721AUpgradeable, IERC165)
    returns (bool)
  {
    return
      interfaceId == type(IERC2981).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
    external
    view
    override
    returns (address receiver, uint256 royaltyAmount)
  {
    return (recipient, (_salePrice * recipientFee) / 1000);
  }

  function affiliatesOf(address wallet)
    external
    view
    virtual
    override
    returns (uint256)
  {
    return referralMap[wallet];
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(_exists(_tokenId), "Does not exist");
    if (revealed == false) {
      return
        string(
          abi.encodePacked(
            uriNotRevealed,
            StringsUpgradeable.toString(_tokenId),
            ".json"
          )
        );
    }

    return
      string(
        abi.encodePacked(
          baseUri,
          StringsUpgradeable.toString(_tokenId),
          ".json"
        )
      );
  }

  // ------ Modifiers ------

  modifier preMintChecks(uint256 count, address to) {
    require(count > 0, "Mint at least one.");
    require(count <= maxPerMint, "Max mint reached.");
    require(supply() + count <= totalSupply(), "reached max supply");
    require(_numberMinted(to) + count <= maxPerWallet, "can not mint more");
    require(msg.value >= mintCostOfOwner(to, count), "Not enough fund.");

    if (pauseMintAt > 0) {
      require(supply() + count <= pauseMintAt, "reached pause supply");
    }

    if (reqToken != address(0)) {
      IERC721 accessToken = IERC721(reqToken);
      require(accessToken.balanceOf(msg.sender) > 0, "Access token not owned");
    }

    _;
  }

  modifier postMintChecks() {
    _;

    if (pauseMintAt > 0 && supply() >= pauseMintAt) {
      open = false;
      presaleOpen = false;
      pauseMintAt = 0;
    }
  }

  function addressAndUintToBytes(address _address, uint256 _uint)
    public
    pure
    returns (bytes memory)
  {
    return bytes(abi.encodePacked(_address, _uint));
  }

  // copy pasta https://github.com/GNSPS/solidity-bytes-utils/blob/6458fb2780a3092bc756e737f246be1de6d3d362/contracts/BytesLib.sol
  function toAddress(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (address)
  {
    require(_bytes.length >= _start + 20, "toAddress_outOfBounds");
    address tempAddress;

    assembly {
      tempAddress := div(
        mload(add(add(_bytes, 0x20), _start)),
        0x1000000000000000000000000
      )
    }

    return tempAddress;
  }

  function toUint256(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (uint256)
  {
    require(_bytes.length >= _start + 32, "toUint256_outOfBounds");
    uint256 tempUint;

    assembly {
      tempUint := mload(add(add(_bytes, 0x20), _start))
    }

    return tempUint;
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override onlyAllowedOperator(from) {
    super.transferFrom(from, to, tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override onlyAllowedOperator(from) {
    super.safeTransferFrom(from, to, tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public override onlyAllowedOperator(from) {
    super.safeTransferFrom(from, to, tokenId, data);
  }
}
