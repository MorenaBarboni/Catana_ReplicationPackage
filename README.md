<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# Catana - Replication Package
This repository contains the replication package for Catana. The main branch includes a fork of [Catana](https://github.com/MorenaBarboni/Catana_ReplicationPackage) that permits ro run capture-replay testing on the sumo mutants.

The set-up and results for the specific projects can be found in the respective branches:
* BSTPStaking - ```git checkout experiment-bstpstaking```
* GMMToken - ```git checkout experiment-gmmtoken```
* DeDudes - ```git checkout experiment-dedudes```
* Lucids - ```git checkout experiment-lucids```
* Paladin - ```git checkout experiment-paladin```

## Getting Started
1. Install the dependencies: with ```npm install```.
2. Add your Infura and Etherscan API keys in ```catana-config.js```.
3. Add your USC configuration in ```catana-config.js```.
4. If needed, add the correct compiler version in ```hardhat-config.js```.

## Commands

| Command       | Description                        | Usage                    | Example                             |
|---------------|------------------------------------|--------------------------|-------------------------------------|
|`capture <nTx> [startBlock]`    | Extract a window of max nTx transactions executed on the Proxy, from an optional startBlock | `$ npm start buildWindow` | `$ npm start buildWindow 10000` |
| `replay <strategy>`    | Replay transactions on the local USC (single txHash, all) | `$ npm start replay <strategy>` | `$ npm start replay 0x078abc...` |
| `replayMutants`    | Replay transactions on the SuMo mutants (or on a specific mutant) according to a strategy (single txHash, all)| `$ npm start replayMutants  <strategy> [mutantHash]` | `$ npm start replayMutants all` |
| `clean`    | Clean the testing environment | `$ npm start clean` | `$ npm start clean` |

## Project Structure

### Catana modules and configuration files
* ```catana-config.js```: project configuration; 
* ```commands.js```: command interface;  
* ```decoder.js```: module for processing contract storage data and replay testing information;  
* ```fetchProcessingData.js```: module for fetching data from APIs, files and other artifacts;  
* ```index.js```: main; 
* ```scraper.js```: module for scraping account state diff from Etherscan; 
* ```testInterface.js```: interface for running Hardhat scripts;  
* ```test/test_mainnet_hardhat.js```: the core replay test script of Catana;
* ```validator.js```: module for validating the replay testing results;


### Hardhat directories and config files
* ```artifacts/```: compiled hardhat artifacts;
* ```contracts/```: source codes of the Proxy contract, and of the Local Logic contract under test (V2);
* ```contracts/deployed```: source codes of the Proxy contract, and of the old Logic contract deployed on Mainnet (V1);
* ```hardhat.config.js```: Hardhat configuration file; 

## Configuration

The Catana configuration is specified in a [catana-config.js](https://github.com/MorenaBarboni/Catana/blob/main/src/catana-config.js) file.

| Field | Description | Default Value |
| ------ | ------ |  :----: |
| ```catanaDir```| name of the directory where the catana logs are saved | ```./catana``` |
| ```sumoDir```| path to the directory where the sumo artifacts are saved | ```./sumo``` |
| ```transactionsPath```| path to the file containing the transactions to be replayed | ```./catana/transactions/transactions.json``` |
| ```DeployedSourcesDir```| path to the folder where the sources of the deployed contracts will be stored | ```./contracts/deployed``` |
| ```UpgradedSourcesDir```| path to the folder where the sources of the upgraded contracts (SUT) are stored | ```./contracts``` |
| ```ProxyPath```| Local path to the source code of the Proxy contract | - |
 | ```UpgradedLogicPath```| Local path to the source code of the upgraded Logic contract under test | - | 
 | ```DeployedProxyAddr```| Address of the Proxy contract deployed on the Mainnet | - |  
 | ```DeployedLogicAddr```| Address of the Logic contract (V1) deployed on the Mainnet | - |
 | ```stateVarsBlacklist```| Blacklist for state variables to be ignored during Capture-Replay testing |  ```["__gap", "_gap"]```| 
| ```INFURA_KEY```| Infura api key | - |
| ```ETHERSCAN_KE```| Etherscan api key | - |

Here's a simple example of ```catana-config.js```.

```
module.exports = {
    catanaDir: "./catana",
    sumoDir: "./sumo",
    transactionsPath: "./catana/transactions/transactions.json",
    DeployedSourcesDir: "./contracts/deployed",
    UpgradedSourcesDir: "./contracts",
    ProxyPath: "./contracts/CErc20Delegator.sol",
    UpgradedLogicPath: "./contracts/CErc20Delegate.sol",
    DeployedProxyAddr: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
    DeployedLogicAddr: "0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F",
    stateVarsBlacklist: ["__gap", "_gap", "myVar"],
    INFURA_KEY: "your-infura-key",
    ETHERSCAN_KEY: "your-etherscan-key"
}
```
