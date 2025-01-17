// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract TeamMembersUpgradeable is OwnableUpgradeable {
  mapping(address => bool) private members;

  function addTeamMember(address _address) public onlyOwner {
    require(_address != address(0));
    members[_address] = true;
  }

  function removeTeamMember(address _address) public onlyOwner {
    require(_address != address(0));

    delete members[_address];
  }

  function isTeamMember(address _address) public view returns (bool) {
    return members[_address] == true;
  }

  modifier onlyTeamOrOwner() {
    require(owner() == _msgSender() || isTeamMember(_msgSender()));
    _;
  }
}
