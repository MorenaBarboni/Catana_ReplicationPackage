<div align="center">
  <img src="resources/logo.png" width="250" />
</div>

# BSTPStaking Experiment Branch
This branch includes the experimental setup and data for the Lucids project.

## BSTPStaking Project Details

### Smart Contracts

The full Catana replay testing configuration is specified in the ```./catana-config.js``` file.

* Deployed Proxy Contract P Address (BSTPStakingProxy.sol): ```0x57ba886442d248c2e7a3a5826f2b183a22ecc73e```
* Deployed Logic Contract L1 Address (BSTPStaking.sol): ```0x5d2c0cc239b33ffc01337c90194acacd50c79088```
* Deployed Sources ```./contracts/deployed```: Source code of the Proxy and Logic contracts deployed on the Mainnet; 
* Deployed Baseline: ```./contracts/```: A copy of the deployed source codes to be mutated during the replay testing process; 

### Mutants
*Mutants M*: We generated 100 random mutants of the Logic contract L1. The Sources for all the 100 random mutants can be found in: ```./sumo/results/mutants``` 

### Transaction History
*Transaction history T*: The proxy P features 1,175 successfull transaction. These can be found in : ```./catana/transactions/transactions.json```

The transactions were captured considering:
- *EndBlock*: 20357000
- *StartBlock*: 16483397 + 1
- *UpgradeBlock*: 16483397 includes the upgrade transaction for the Logic contract
- *UpgradeTransaction*: 0xe8fdc47e39c5520a73ad64a8ee495fb083edfcc514bf51200f8034d8ad680747

### Evaluated Test Suites
The data for each test suite built using different policies (last, random, unique, frequency) and budgets (n) can be found in  ```./catana/results/bstpstaking-<policyName>-i_max_20.csv```

### Replay Testing Results
The complete replay testing results for all transactions in T on each mutant M can be found in: ```./catana/results/replayMatrix.csv```

## Running the Experiment

### Running the Mutation Testing Experiment
The current branch is already set-up for the experiment on BSTPStaking. If you want to re-run the experiment:

1. Install the dependencies: ```npm install```;
2. Set up your Infura and Etherscan API keys in the ```catana-config.js```;
3. You can start replay testing with all transactions in ```transactions.json``` on all the mutants using ```npm start replayMutants all```. 