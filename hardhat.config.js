require('@nomicfoundation/hardhat-toolbox');
require('hardhat-storage-layout');

module.exports = {
  networks: {
    //hardhat: {
    //  allowUnlimitedContractSize: true
    //}   
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
      },
      {
        version: "0.5.16",
      },
      {
        version: "0.5.12",
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    },
  },
  mocha: {
    timeout: 100000000
  },
};
