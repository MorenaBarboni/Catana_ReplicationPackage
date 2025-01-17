//External modules
require('hardhat')
const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
//Catana modules
const fetch = require('./fetchProcessingData');
const logger = require('./logger');
const testingInterface = require('./testInterface')
//Catana configuration
const catanaConfig = require('./catana-config');

/**
* Performs the required setup operations before starting the replay testing process
* @param {Function} callback - Callback function to be executed once the setup is completed
*/
async function setup(callback) {
    console.log(chalk.yellow("Setting up testing environment..."))

    const { catanaDir, sumoDir, ProxyPath, UpgradedLogicPath, DeployedLogicAddr, DeployedProxyAddr, DeployedSourcesDir, UpgradedSourcesDir } = catanaConfig;

    //Check configuration
    if (catanaDir === "" || sumoDir === "" || ProxyPath === "" || UpgradedLogicPath === "" || DeployedLogicAddr === "" ||
        DeployedProxyAddr === "" || DeployedSourcesDir === "" || UpgradedSourcesDir === "") {
        throw new Error("Catana configuration incomplete.")
    }

    const proxyName = fetch.getFileName(ProxyPath);
    const logicName = fetch.getFileName(UpgradedLogicPath);
    const deployedLogicPath = fetch.getDeployedContractSourcePath(catanaConfig.UpgradedLogicPath);

    //Download sources of deployed logic contracts
    if (!fs.existsSync(DeployedSourcesDir)) { fs.mkdirSync(DeployedSourcesDir, { recursive: true }); }
    if (!fs.existsSync(deployedLogicPath) || !fs.existsSync(ProxyPath)) {
        fetch.cleanDir(DeployedSourcesDir);
        console.log("Retrieving sources for Deployed Logic: " + logicName + " @ " + DeployedLogicAddr)
        await fetch.fetchContractSourcesByAddress(DeployedLogicAddr, DeployedSourcesDir);
        console.log("Retrieving sources for Deployed Proxy: " + proxyName + " @ " + DeployedProxyAddr)
        await fetch.fetchContractSourcesByAddress(DeployedProxyAddr, DeployedSourcesDir);
    } else {
        console.log("Sources already available locally")
    }

    //Clean previous build-info
    fetch.cleanDir("./artifacts");

    //Create log dir and setup reports
    if (!fs.existsSync(catanaConfig.catanaDir)) { fs.mkdirSync(catanaConfig.catanaDir); }
    callback();
}

/**
* Replay all transactions @ catanaConfig.transactionsPath on the deployed and upgraded SUT.  
* If a transaction hash is specified, only that transaction will be replayed.
* @param {string} strategy - the replay strategy (txHash, all)
* @param {String} [txHash=null]  - the hash of the transaction to be replayed (optional)
*/
async function replay(strategy) {

    logger.setupCatanaReports();

    let transactions = [];

    if (strategy.startsWith("0x")) {
        const txSamplePath = catanaConfig.transactionsPath;
        const txHash = strategy;
        const transaction = fetch.getTransaction(txHash, txSamplePath);
        transactions.push(transaction);
        console.log(chalk.bold.yellow(`> Replay transaction ${txHash}`));
        setup(async () =>
            await runTest(transactions)
        );
    }
    //Replay the entire window
    else if (strategy === "all") {
        const txSamplePath = catanaConfig.transactionsPath;
        transactions = fetch.getAllTransactions(txSamplePath);
        console.log(chalk.bold.yellow(`> Replay all transactions in ${txSamplePath}`));
        setup(async () =>
            await runTest(transactions)
        );
    }
    else {
        throw new Error("The selected strategy is not valid.")
    }
}

/**
* Replay all transactions @ catanaConfig.transactionsPath on the deployed SUT and its SuMo mutants.  
* If a transaction hash is specified, only that transaction will be replayed.
* If a mutant hash is specified, only that mutant will be applied an tested.
* @param {String} strategy - the replay strategy (txHash or all)
* @param {String} [mutantHash=null]  - the hash of the specific mutant to be tested (optional)
*/
async function replayOnMutants(strategy, mutantHash = null) {

    console.log(chalk.bold.yellow(`> Start Mutation Testing`));
    logger.setupCatanaMtReports();

    const txSamplePath = catanaConfig.transactionsPath;
    let transactionsToReplay = [];
    let mutants = fetch.readSumoMutationsJson();
    let mutantsSourceNames = fetch.readSumoMutantSourceNames();

    //Replay a single transaction
    if (strategy.startsWith("0x")) {
        const transaction = fetch.getTransaction(strategy, txSamplePath);
        transactionsToReplay.push(transaction);
        console.log(chalk.bold.yellow(`> Replay single transaction ${strategy}`));
    }
    //Replay the entire window
    else if (strategy === "all") {
        transactionsToReplay = fetch.getAllTransactions(txSamplePath);
        console.log(chalk.bold.yellow(`> Replay all transactions in ${txSamplePath}`));
    }
    else {
        throw new Error("The selected strategy is not valid.")
    }

    setup(async () =>
        await runTestOnMutants(transactionsToReplay, mutants, mutantsSourceNames, mutantHash)
    );
}

/**
* Run replay tests with a list of transactions belonging to a certain strategy
* @param {Array} transactions - the list of transactions to be replayed
*/
async function runTest(transactions) {
    for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];

        const status = testingInterface.spawnTest(tx, null);
        const txData = logger.readDataFromJson(tx.hash, "tx");
        const outcomeChanges = logger.readDataFromJson(tx.hash, "outcomeChanges");
        const storageChanges = logger.readDataFromJson(tx.hash, "storageChanges");
        const duration = logger.readDataFromJson(tx.hash, "duration");

        logger.logReplayResultToCsv(tx, txData, outcomeChanges, storageChanges, status, duration);

        if (status === 0) {
            console.info(chalk.green("Replay testing session for " + tx.hash + " passed in ", duration));
        } else if (status === 1) {
            console.error(chalk.red("Replay testing session for " + tx.hash + " failed in ", duration));
        }
    }
    console.log(chalk.bold.yellow('> Done 👋'));
}

/**
* Run replay tests with a list of transactions on the mutants of the local contracts
* @param {String[]} transactions - the list of transaction objects to be replayed
* @param {Object} mutants - all the mutants in the sumo/results/mutations.json
* @param {String[]} mutantsSourceNames - all the mutants source names in the sumo/mutants folder
* @param {String} [selectedMutant="null"] - the hash of a specfic mutant to be tested (optional)
*/
async function runTestOnMutants(transactions, mutants, mutantsSourceNames, selectedMutant = null) {

    //Loop all mutant sources
    mutantsSourceNames.forEach(mutantSourceName => {

        //Get mutant hash and target contract from the source file name
        const mutantHash = mutantSourceName.split('-')[1].split(".sol")[0];
        const contractName = mutantSourceName.split('-')[0];

        //Retrieve corresponding mutant data from the mutations.json
        const mutantData = mutants[contractName].filter((mutant) => mutant.id === mutantHash)[0];

        if (selectedMutant === null || selectedMutant === mutantHash) {

            if (mutantData && mutantData !== undefined) {

                console.info(chalk.green("> Testing mutant " + mutantHash + " of " + contractName + '\n'));

                //Copy the mutant in the local contract folder
                fetch.applyMutant(mutantSourceName, contractName);

                //Replay each transaction in the sample on the mutant
                for (let i = 0; i < transactions.length; i++) {

                    //Replayed Transaction
                    let tx = transactions[i];

                    let replayRunStartTime = Date.now();
                    let replayRunDuration;

                    //Init mutant data for capture-replay session
                    mutantData.status = "live"; //mutant status (live, killed, stillborn or not-tested)
                    mutantData.replayStatusCode = null; //a status code for the replay testing session
                    mutantData.hasOutcomeChanged = false;
                    mutantData.hasStorageChanged = false;
                    mutantData.outcomeChanges = {}; //outcome changes detected by the replayed transaction
                    mutantData.storageChanges = []; //storage changes detected by the replayed transaction
                    mutantData.testingTime = 0; //replay testing time for a transaction

                    //Compile the contracts
                    const compiled = testingInterface.spawnCompile();

                    //If the mutant is not stillborn, start Capture-Replay
                    if (compiled === 0) {
                        console.info(chalk.green("> Mutant compiled successfully\n"));

                        //Run replay testing on the mutant with tx
                        mutantData.replayStatusCode = testingInterface.spawnTest(tx, mutantHash);
                        replayRunDuration = Date.now() - replayRunStartTime;

                        //Extract decoded transaction input
                        tx.decodedInput = logger.readDataFromMtJson(mutantHash, tx.hash, "input");


                        // Check for a replay testing failure                 
                        if (mutantData.replayStatusCode !== 0 && mutantData.replayStatusCode !== 1) {
                            mutantData.status = "error"                            
                        } else {
                            //Retrieve outcome changes information after replay testing
                            let outcomeChanges = logger.readDataFromMtJson(mutantHash, tx.hash, "outcomeChanges");
              
                            if (outcomeChanges && Object.keys(outcomeChanges).length > 0 && !outcomeChanges.isEqual) {
                                mutantData.hasOutcomeChanged = true;
                                mutantData.outcomeChanges = outcomeChanges;
                                mutantData.status = "killed(o)"
                            }

                            //Retrieve eventual storage changes after replay testing
                            let storageChanges = logger.readDataFromMtJson(mutantHash, tx.hash, "storageChanges");
         
                            if (storageChanges && storageChanges !== null && storageChanges.length > 0) {
                                mutantData.storageChanges = storageChanges;
                                mutantData.hasStorageChanged = true;

                                if (mutantData.hasOutcomeChanged) {
                                    mutantData.status = "killed(os)"
                                } else {
                                    mutantData.status = "killed(s)"
                                }
                            }
                        }
                    }
                    else {
                        replayRunDuration = Date.now() - replayRunStartTime;
                        mutantData.replayStatusCode = 10;
                        mutantData.status = "uncompilable";
                    }

                    mutantData.replayDuration = logger.getTimestamp(replayRunDuration);

                    console.info(chalk.yellow("Mutant " + mutantData.id + " is " + mutantData.status + " for tx: " + tx.hash));
                    logger.logMutantResultToCsv(mutantData, tx);
                }
                fetch.restoreMutant(contractName);
                console.info(chalk.yellow("Mutant was tested with  " + transactions.length + " transactions. Testing next mutant. "));

            } else {
                console.log(chalk.red("WARNING: " + mutantHash + "not found"));
            }
        }
    });
    console.log("\nMutation Testing DONE.")
}

/**
* Clean the testing environment (fetched sources, hardhat artifacts, cache)
*/
function cleanEnv() {
    fetch.cleanDir("./artifacts");
    fetch.cleanDir("./cache");
    fetch.deleteDir(catanaConfig.DeployedSourcesDir);
}

module.exports = {
    cleanEnv: cleanEnv,
    replay: replay,
    replayOnMutants: replayOnMutants,
};