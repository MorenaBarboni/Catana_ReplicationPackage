<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# Lucids Experiment Branch
This branch includes the experimental setup and data for the Lucids project.

## Lucids Project Details

### Smart Contracts

The full Catana replay testing configuration is specified in the ```./catana-config.js``` file.

* Deployed Proxy Contract P Address (LucidsOfficial.sol): ```0x7DeF9c6b08718Cc9e326CcB057B6C384e6788AD0```
* Deployed Logic Contract L1 Address (NFTArtGenCreatorImpl.sol): ```0xea690f45047F6be5E513D35b44933999866C5aA6```
* Deployed Sources ```./contracts/deployed```: Source code of the Proxy and Logic contracts deployed on the Mainnet; 
* Deployed Baseline: ```./contracts/```: A copy of the deployed source codes to be mutated during the replay testing process; 

### Mutants
*Mutants M*: We generated 100 random mutants of the Logic contract L1. The Sources for all the 100 random mutants can be found in: ```./sumo/results/mutants``` 

### Transaction History
*Transaction history T*: The proxy P features 1,526 successfull transaction. These can be found in : ```./catana/transactions/transactions.json```

The transactions were captured considering:
- *EndBlock*: 20357000
- *StartBlock*: 0

### Evaluated Test Suites
The data for each test suite built using different policies (last, random, unique, frequency) and budgets (n) can be found in  ```./catana/results/lucids-<policyName>-i_max_20.csv```.

### Replay Testing Results
The complete replay testing results for all transactions in T on each mutant M can be found in: ```./catana/results/replayMatrix.csv```

## Running the Experiment

### Running the Mutation Testing Experiment
The current branch is already set-up for the experiment on Lucids. If you want to re-run the experiment:

1. Install the dependencies: ```npm install```;
2. Set up your Infura and Etherscan API keys in the ```catana-config.js```
3. You can start replay testing with all transactions in ```transactions.json``` on all the mutants using ```npm start replayMutants all```. 