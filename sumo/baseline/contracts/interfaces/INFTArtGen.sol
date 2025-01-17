// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;

interface INFTArtGen {
  /**
   *
   * @notice Set the commission for the contract
   * @param _val1 The new commission value
   * @dev Only callable by the owner/team
   */
  function setCommission(uint256 _val1) external;

  /**
   *
   * @notice Update the sale parameters
   * @param _open Whether the sale is open
   * @param _cost The cost of each token
   * @param _maxW The max number of mints per wallet
   * @param _maxM The max number of mints per transaction
   * @dev Only callable by the owner/team
   */
  function updateSale(
    bool _open,
    uint256 _cost,
    uint32 _maxW,
    uint32 _maxM
  ) external;

  /**
   *
   * @notice Update the ERC20 token (most contracts will not use this)
   * @param _address The new address of the token
   * @dev Only callable by the owner/team
   */
  function updateReqToken(address _address) external;

  /**
   *
   * @notice Update the presale parameters
   * @param _open Whether the presale is open
   * @param root The merkle root for the whitelisted addresses
   * @dev Only callable by the owner/team
   */
  function updatePresale(bool _open, bytes32 root) external;

  /**
   *
   * @notice Reveal the collection's URI
   * @param _revealed Whether the collection is revealed
   * @param _uri The collection's URI
   * @dev Only callable by the owner/team
   */
  function updateReveal(bool _revealed, string memory _uri) external;

  /**
   *
   * @notice Update the max number of free mints
   * @param _cap The new cap
   * @dev Only callable by the owner/team
   */
  function updateMaxFreeMint(uint32 _cap) external;

  /**
   *
   * @notice Update the number to pause minting at
   * @param _pauseAt The new number to pause minting at
   * @dev Only callable by the owner/team
   */
  function updatePauseMintAt(uint256 _pauseAt) external;

  /**
   *
   * @notice Update the base URI
   * @param _uri The new base URI
   * @dev Only callable by the owner/team
   */
  function updateBaseUri(string memory _uri) external;

  /**
   *
   * @notice Update the withdraw split
   * @param _addresses The new addresses
   * @param _fees The new shares for each address
   * @dev Only callable by the owner/team
   */
  function updateWithdrawSplit(
    address[] memory _addresses,
    uint256[] memory _fees
  ) external;

  /**
   *
   * @notice Get the current commission
   * @return The current withdraw split
   */
  function getWithdrawSplit()
    external
    view
    returns (address[] memory, uint256[] memory);

  /**
   *
   * @notice Update the referral parameters
   * @param _open Whether the referral program is open
   * @param _val The referral value
   * @dev Only callable by the owner/team
   */
  function updateReferral(bool _open, uint256 _val) external;

  /**
   *
   * @notice Update the royalties parameters
   * @param _recipient The new royalty recipient
   * @param _fee The royalty fee
   * @dev Only callable by the owner/team
   */
  function updateRoyalties(address _recipient, uint256 _fee) external;

  /**
   *
   * @notice Withdraw the native token balance from the contract
   * @dev Only callable by the owner/team
   */
  function withdraw() external payable;

  /**
   *
   * @notice Send tokens to a list of recipients
   * @param _recipients The recipients
   * @param _amount The amount to send to each recipient
   * @dev Only callable by the owner/team
   */
  function airdrop(address[] memory _recipients, uint256[] memory _amount)
    external;

  /**
   *
   * @notice Mint tokens
   * @param count The number of tokens to mint
   */
  function mint(uint256 count) external payable;

  /**
   *
   * @notice Mint tokens to a specific address
   * @param count The number of tokens to mint
   * @param to The address to mint to
   */
  function mintTo(uint256 count, address to) external payable;

  /**
   *
   * @notice Mint all tokens to the contract owner
   * @dev Only callable by the owner
   */
  function mintAll() external payable;

  /**
   *
   * @notice Mint tokens when presale is open
   * @param count The number of tokens to mint
   * @param proof The merkle proof for the address
   */
  function presaleMint(uint32 count, bytes32[] calldata proof) external payable;

  /**
   *
   * @notice Mint tokens when presale is open to a specific address
   * @param count The number of tokens to mint
   * @param proof The merkle proof for the address
   * @param to The address to mint to
   */
  function presaleMintTo(
    uint32 count,
    bytes32[] calldata proof,
    address to
  ) external payable;

  /**
   *
   * @notice Mint tokens while the referral program is open
   * @param count The number of tokens to mint
   * @param referrer The address of the referrer
   */
  function referralMint(uint32 count, address referrer) external payable;

  /**
   *
   * @notice Mint tokens while the referral program is open to a specific address
   * @param count The number of tokens to mint
   * @param referrer The address of the referrer
   * @param to The address to mint to
   */
  function referralMintTo(
    uint32 count,
    address referrer,
    address to
  ) external payable;

  /**
   *
   * @notice Get the minted count
   */
  function supply() external view returns (uint256);

  /**
   *
   * @notice Get the max supply
   */
  function totalSupply() external view returns (uint256);

  /**
   *
   * @notice Get the number of tokens minted by a specific address
   * @param _address The address to check
   */
  function numberMintedOfOwner(address _address)
    external
    view
    returns (uint256);

  /**
   *
   * @notice Get the number of tokens a specific address can still mint
   * @param _address The address to check
   */
  function remainingMintsOfOwner(address _address)
    external
    view
    returns (uint256);

  /**
   *
   * @notice Get the cost to mint _count tokens for a specific address
   * @param _address The address to check
   * @param _count The number of tokens to check
   */
  function mintCostOfOwner(address _address, uint256 _count)
    external
    view
    returns (uint256);

  /**
   * @notice Get the number of referral mints for a specific address
   * @param wallet The address to check
   */
  function affiliatesOf(address wallet) external view returns (uint256);
}
