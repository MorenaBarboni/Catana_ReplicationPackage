import "./NFTArtGenUpgradeable.sol";

contract NFTArtGenCreatorImpl is NFTArtGenUpgradeable {
  function initialize(
    string memory _name,
    string memory _symbol,
    uint256 _maxSupply,
    uint256 _commission
  ) public initializer {
    __NFTArtGen_init(_name, _symbol, _maxSupply, _commission);
  }
}
