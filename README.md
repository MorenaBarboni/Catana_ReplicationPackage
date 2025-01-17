<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# DeDudes Experiment Branch
This branch includes the experimental setup and data for the DeDudes project.

## DeDudes Project Details

The full Catana configuration is specified in the ```./catana-config.js``` file.

### Smart Contracts
* Deployed Proxy Contract Address (DeDudes.sol): ```0xC28b0F274c6eD418d85f9d9CF77c245ada6091DD```
* Latest Deployed Logic Contract Address (NFTArtGenCreatorImpl.sol): ```0x8dfd8220976a0445b1779e5e9d6cb0bfe7b5dadc```
* Deployed Sources ```./contracts/deployed```: Source code of the Proxy and Logic contracts deployed on the Mainnet; 
* Deployed Baseline: ```./contracts/```: A copy of the deployed source codes to be mutated during the replay testing process; 

### Mutants
*Mutants M*: We generated 100 random mutants of the Logic contract L1. The Sources for all the 100 random mutants can be found in: ```./sumo/results/mutants``` 

### Transaction History
*Transaction history T*: The proxy P features 2,368 successfull transaction. These can be found in : ```./catana/transactions/transactions.json```

The transactions were captured considering:
- *EndBlock*: 20357000
- *StartBlock*: 0.

### Evaluated Test Suites
The data for each test suite built using different policies (last, random, unique, frequency) and budgets (n) can be found in  ```./catana/results/dedudes-<policyName>-i_max_20.csv```

### Replay Testing Results
The complete replay testing results for all transactions in T on each mutant M can be found in: ```./catana/results/replayMatrix.csv```

## Running the Experiment

### Running the Mutation Testing Experiment
The current branch is already set-up for the experiment on DeDudes. If you want to re-run the experiment:

1. Install the dependencies: ```npm install```;
2. Set up your Infura and Etherscan API keys in the ```catana-config.js```;
3. You can start replay testing with all transactions in ```transactions.json``` on all the mutants using ```npm start replayMutants all```. 