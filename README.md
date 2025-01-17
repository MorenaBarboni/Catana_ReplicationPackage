<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# Paladin Experiment Branch
This branch includes the experimental setup and data for the Paladin project.

## Paladin Project Details

### Smart Contracts

The full Catana replay testing configuration is specified in the ```./catana-config.js``` file.

* Deployed Proxy Contract Address (ControllerProxy.sol): ```0x241326339ced11ecc7ca07e4aa350234c57f53e5```
* Latest Deployed Logic Contract Address (PaladinController.sol): ```0xcf131548b18d55fb29df2df47b360c41389ebb2b```
* Deployed Sources ```./contracts/deployed```: Source code of the Proxy and Logic contracts deployed on the Mainnet; 
* Deployed Baseline: ```./contracts/```: A copy of the deployed source codes to be mutated during the replay testing process; 

### Mutants
*Mutants M*: We generated 100 random mutants of the Logic contract L1. The Sources for all the 100 random mutants can be found in: ```./sumo/results/mutants``` 

### Transaction History
*Transaction history T*: The proxy P features 578 successfull transaction. These can be found in : ```./catana/transactions/transactions.json```

The transactions were captured considering:
- *EndBlock*: 20357000
- *StartBlock*: 14880569
- *UpgradeBlock*: 14880568
- *UpgradeTransaction*: 0x93ecdad10694e465fd69ab919c1f6dca084f23bcd3640234d73e5862b4ba036b. 


### Evaluated Test Suites
The data for each test suite built using different policies (last, random, unique, frequency) and budgets (n) can be found in  ```./catana/results/Paladin-<policyName>-i_max_20.csv```

### Replay Testing Results
The complete replay testing results for all transactions in T on each mutant M can be found in: ```./catana/results/replayMatrix.csv```

## Running the Experiment

### Running the Mutation Testing Experiment
The current branch is already set-up for the experiment on Paladin. If you want to re-run the experiment:

1. Install the dependencies: ```npm install```;
2. Set up your Infura and Etherscan API keys in the ```catana-config.js```;
3. You can start replay testing with all transactions in ```transactions.json``` on all the mutants using ```npm start replayMutants all```. 