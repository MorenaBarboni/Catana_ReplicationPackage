<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# GMMToken Experiment Branch
This branch includes the experimental setup and data for the GMMToken project.

## GMMToken Project Details

### Smart Contracts

The full Catana replay testing configuration is specified in the ```./catana-config.js``` file.

* Deployed Proxy Contract P Address (TransparentUpgradeableProxy.sol): ```0x4B19C70Da4c6fA4bAa0660825e889d2F7eaBc279```
* Deployed Logic Contract L1 Address (BridgeMintableTokenV2.sol): ```0x60a1B168CE980Ef69250362a66e40f8A7050Ce2F```
* Deployed Sources ```./contracts/deployed```: Source code of the Proxy and Logic contracts deployed on the Mainnet; 
* Deployed Baseline: ```./contracts/```: A copy of the deployed source codes to be mutated during the replay testing process; 


### Mutants
*Mutants M*: We generated 100 random mutants of the Logic contract L1. The Sources for all the 100 random mutants can be found in: ```./sumo/results/mutants``` 



### Transaction History
*Transaction history T*: The proxy P features 2,547 successfull transaction. These can be found in : ```./catana/transactions/transactions.json```

The transactions were captured considering:
- *EndBlock*: 20357000
- *StartBlock*: 0

### Evaluated Test Suites
The data for each test suite built using different policies (last, random, unique, frequency) and budgets (n) can be found in  ```./catana/results/lucids-<policyName>-i_max_20.csv```

### Replay Testing Results
The complete replay testing results for all transactions in T on each mutant M can be found in: ```./catana/results/replayMatrix.csv```


## Running the Experiment

### Running the Mutation Testing Experiment
The current branch is already set-up for the experiment on GMMToken. If you want to re-run the experiment:

1. Install the dependencies: ```npm install```;
2. Set up your Infura and Etherscan API keys in the ```catana-config.js```;
3. You can start replay testing with all transactions in ```transactions.json``` on all the mutants using ```npm start replayMutants all```. 
