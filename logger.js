const fs = require('fs');
const catanaConfig = require('./catana-config');
const path = require("path");

const reportPaths = {
  resultsCsv: path.normalize(catanaConfig.catanaDir + "/results.csv"),
  mtResultsCsv: path.normalize(catanaConfig.catanaDir + "/mt-results.csv"),
  resultsJson: path.normalize(catanaConfig.catanaDir + "/results.json"),
  mtresultsJson: path.normalize(catanaConfig.catanaDir + "/mt-results.json"),
  mtExecutionsCsv: path.normalize(catanaConfig.catanaDir + "/mt-results-executions.csv")
}

/**
* Setup the standard catana reports: resultsCsv and resultsJson
*/
function setupCatanaReports() {

  let headers = ['transaction', 'function', 'input', 'value', 'hasOutcomeChanged', 'outcomeBefore', 'outcomeAfter',
    'hasStorageChanged', 'storageChanges', 'replayOutcome', 'replayResult', 'replayStatusCode', 'duration\n'];

  fs.writeFileSync(reportPaths.resultsCsv, headers.join("$"), function (err) {
    if (err) return console.log(err);
  })
  fs.writeFileSync(reportPaths.resultsJson, "{}", function (err) {
    if (err) return console.log(err);
  });
}

/**
* Setup the catana reports for mutation testing: mtResultsCsv and mtresultsJson
*/
function setupCatanaMtReports() {
  let headers = [
    'txHash',
    'mutantHash',
    'txFrom',
    'txBlockNumber',
    'txFunction',
    'txInput',
    'txValue',
    'mutatedFile',
    'mutatedFunction',
    'mutatedLOC',
    'mutOp',
    'original',
    'replacement',
    'mutantStatus',
    'detectedChanges',
    'hasOutcomeChanged',
    'outcomeChanges',
    'hasStorageChanged',
    'storageChanges',
    'replayStatus',
    'replayStatusCode',
    'replayDuration\n',
  ];

  fs.writeFileSync(reportPaths.mtResultsCsv, headers.join("$"), function (err) {
    if (err) return console.log(err);
  })
  fs.writeFileSync(reportPaths.mtresultsJson, "{}", function (err) {
    if (err) return console.log(err);
  });
}

/**
* Appends the replay testing result to the resultsCsv report
* @param {Object} transaction - the replayed transaction data
* @param {Number} statusCode - the replay testing session status code 
* @param {String} time - the replay testing time in mm.ss.ms format 
*/
function logReplayResultToCsv(transaction, txData, outcomeChanges, storageChanges, statusCode, duration) {
  const reportPath = reportPaths.resultsCsv;

  const hasStorageChanged = storageChanges && storageChanges.length > 0;
  const hasOutcomeChanged = outcomeChanges && Object.keys(outcomeChanges).length > 0 && !outcomeChanges.isEqual;
  if (outcomeChanges) {
    if (outcomeChanges.valueBefore = "") outcomeChanges.valueBefore = "\"\""
    if (outcomeChanges.valueAfter = "") outcomeChanges.valueAfter = "\"\""
  }

  const replayStatusCode = parseReplayStatusCode(statusCode);
  const replayOutcome = getChangesDescription(hasOutcomeChanged, hasStorageChanged, replayStatusCode)

  const row = [transaction.hash, txData.functionName, JSON.stringify(txData.input), txData.value,
    hasOutcomeChanged, outcomeChanges ? outcomeChanges.valueBefore : null, outcomeChanges ? outcomeChanges.valueAfter : null,
    hasStorageChanged, JSON.stringify(storageChanges), replayOutcome, replayStatusCode, statusCode, duration + '\n'].join("$");

  appendToFile(reportPath, row);
}

/**
 * Appends the result of replay testing for a mutant to the mtResultsCsv
 * @param {Object} mutantData - the sumo mutant object with additional fields related to replay testing
 * @param {Object} txData - the replayed transaction data
  */
function logMutantResultToCsv(mutantData, txData) {
  const reportPath = reportPaths.mtResultsCsv;

  const replayStatusDescription = parseReplayStatusCode(mutantData.replayStatusCode);
  const changesDescription = getChangesDescription(mutantData.hasOutcomeChanged, mutantData.hasStorageChanged, mutantData.replayStatusCode)

  const row = [
    txData.hash,
    mutantData.id,
    txData.from,
    txData.blockNumber,
    txData.functionName,
    JSON.stringify(txData.decodedInput),
    txData.value,
    mutantData.file,
    mutantData.functionName,
    mutantData.startLine + "-" + mutantData.endLine,
    mutantData.operator,
    parseCode(mutantData.original),
    parseCode(mutantData.replace),
    mutantData.status,
    changesDescription,
    mutantData.hasOutcomeChanged,
    JSON.stringify(mutantData.outcomeChanges),
    mutantData.hasStorageChanged,
    JSON.stringify(mutantData.storageChanges),
    replayStatusDescription,
    mutantData.replayStatusCode,
    mutantData.replayDuration + '\n'
  ].join("$");

  appendToFile(reportPath, row);
}

/**
* Appends a  row to a txt or csv file
* @param {String} path - the csv file path
* @param {String} row - the row to append
*/
function appendToFile(filePath, row) {

  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, row, function (err) {
      if (err) return console.log(err);
    })
  } else {
    throw new Error('Could not access ' + filePath)
  }
}

/**
* Appends the replay results of the current transaction to either the resultsJson or mtresultsJson.
* based on the type of experiment (standard replay testing, or mutation testing)
* @param {Object} transaction - the replayed transaction data
* @param {String} mutantHash - the hash of the mutant on which the transaction was replayed (optional) 
* @param {Object} decodedTransaction - ether's parsed transaction data
* @param {Object} outcomeChanges - the outcomeChanges
* @param {Object} storageChanges - the storageChanges
* @param {Boolean} result - the replay testing session result    
* @param {Number} statusCode - the replay testing session status code 
* @param {Date} duration - the replay testing session duration 
*/
function logResultToJson(transaction, mutantHash, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration) {
  mutantHash === "" ?
    logReplayResultToJson(transaction, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration) :
    logMutantResultToJson(transaction, mutantHash, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration)
}

/**
* Appends the test results of the current transaction to the resultsJson.
* @param {Object} transaction - the replayed transaction data
* @param {Object} decodedTransaction - ether's parsed transaction data
* @param {Object} storageChanges - the outcomeChanges
* @param {Object} storageChanges - the storageChanges
* @param {Boolean} result - the replay testing session result    
* @param {Number} statusCode - the replay testing session status code 
* @param {Date} duration - the replay testing session duration 
*/
function logReplayResultToJson(transaction, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration) {
  const resultsPath = reportPaths.resultsJson;

  let exisitingResults = {};
  if (fs.existsSync(resultsPath)) {
    exisitingResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  }

  let jsonResult = prepareJsonResult(transaction, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration);

  exisitingResults[transaction.hash] = jsonResult;

  fs.writeFileSync(resultsPath, JSON.stringify(exisitingResults, null, 2), 'utf8', (err) => {
    if (err) console.log(err);
  });

  //console.log(`> Result logged for transaction ${transaction.hash}`);
}

/**
* Appends the test results of the current transaction on a mutant to the mtresultsJson.
* For each mutant, this report reports the result of each transaction execution
* @param {Object} transaction - the replayed transaction data
* @param {String} mutantHash - the hash of the mutant on which the transaction was replayed (optional) 
* @param {Object} decodedTransaction - ether's parsed transaction data
* @param {Object} storageChanges - the outcomeChanges
* @param {Object} storageChanges - the storageChanges
* @param {Boolean} result - the replay testing session result    
* @param {Number} statusCode - the replay testing session status code 
* @param {Date} duration - the replay testing session duration 
*/
function logMutantResultToJson(transaction, mutantHash, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration) {
  
  const resultsPath = reportPaths.mtresultsJson;

  let exisitingResults = {};
  if (fs.existsSync(resultsPath)) {
    exisitingResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  }

  let jsonResult = prepareJsonResult(transaction, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration);

  if (!exisitingResults[mutantHash]) {
    exisitingResults[mutantHash] = {};
  }
  exisitingResults[mutantHash][transaction.hash] = jsonResult;

  fs.writeFileSync(resultsPath, JSON.stringify(exisitingResults, null, 2), 'utf8', (err) => {
    if (err) console.log(err);
  });
  //console.log(`> Result logged for transaction ${transaction.hash} and mutant ${mutantHash}`);
}

/**
* Prepares the test results to be logged for a given transaction
* @param {Object} transaction - the replayed transaction data
* @param {Object} decodedTransaction - ether's parsed transaction data
* @param {Object} storageChanges - the outcomeChanges
* @param {Object} storageChanges - the storageChanges
* @param {Boolean} result - the replay testing session result    
* @param {Number} statusCode - the replay testing session status code
* @param {Date} duration - the replay testing session duration 
* @returns an object representing the replay testing result
*/
function prepareJsonResult(transaction, decodedTransaction, outcomeChanges, storageChanges, result, statusCode, duration) {
  //Transaction data 
  let txData = {
    "hash": transaction.hash,
    "functionName": transaction.functionName,
    "input": [],
    "value": transaction.value
  }
  //Transaction arguments
  for (let i = 0; i < decodedTransaction.fragment.inputs.length; i++) {
    let paramData = {}
    const paramName = decodedTransaction.fragment.inputs[i].name;
    const paramDecodedValue = decodedTransaction.args[i];
    paramData[paramName] = String(paramDecodedValue);
    txData.input.push(paramData);
  }

  let jsonResult = {
    "replayOutcome": result,
    "statusCode": statusCode,
    "tx": txData,
    "outcomeChanges": outcomeChanges,
    "storageChanges": storageChanges,
    "testDuration": getTimestamp(duration)
  }

  return jsonResult
}

/**
 * Converts either the resultsJson to a .csv and saves it to file
 * @param {string} jsonPath the path to the json report
 */
function extractExecutionsCsv() {
  const rows = [];
  const jsonData = JSON.parse(fs.readFileSync(reportPaths.mtresultsJson, 'utf8'));

  let headers = ['mutant', 'txHash', 'replayOutcome', 'replayResult', 'replayStatusCode', 'txMethod', 'txInput', 'txValue',
    'hasOutcomeChanged', 'outcomeBefore', 'outcomeAfter', 'hasStorageChanged', 'storageChanges', 'isStorageEqual', "duration"];

  rows.push(headers.join('$'));

  // Function to extract row values from transaction data
  function extractRow(mutantHash, txHash, transactionData) {
    const { statusCode, tx, outcomeChanges, storageChanges, duration } = transactionData;

    const hasOutcomeChanged = outcomeChanges && Object.keys(outcomeChanges).length > 0 && !outcomeChanges.isEqual;
    const hasStorageChanged = storageChanges && storageChanges.length > 0;
    if (outcomeChanges) {
      if (outcomeChanges.valueBefore = "") outcomeChanges.valueBefore = "\"\""
      if (outcomeChanges.valueAfter = "") outcomeChanges.valueAfter = "\"\""
    }

    const replayResult = parseReplayStatusCode(statusCode);
    const replayOutcome = getChangesDescription(hasOutcomeChanged, hasStorageChanged)

    let row = [mutantHash, txHash, replayOutcome, replayResult, statusCode, tx.functionName, JSON.stringify(tx.input), tx.value,
      hasOutcomeChanged, outcomeChanges ? outcomeChanges.valueBefore : null, outcomeChanges ? outcomeChanges.valueAfter : null,
      hasStorageChanged, JSON.stringify(storageChanges), duration
    ]

    return row.join('$');
  }

  // Iterate over each mutant
  for (const mutantHash in jsonData) {
    const transactions = jsonData[mutantHash];
    // Iterate over each transaction
    for (const txHash in transactions) {
      const row = extractRow(mutantHash, txHash, transactions[txHash]);
      rows.push(row);
    }
  }

  const result = rows.join('\n');

  fs.writeFileSync(reportPaths.mtExecutionsCsv, result, 'utf8', (err) => {
    if (err) console.log(err);
  });
}

/**
 * Searches the mutation testing json results file for a specific data field of a mutant-tx execution
 * @param {String} mutantHash - the mutant hash
 * @param {String} txHash -  the transaction hash
 * @param {String} field -  the name of the field to be read  
 * @returns the extracted field value, or null
 */
function readDataFromMtJson(mutantHash, txHash, field) {
  const jsonData = JSON.parse(fs.readFileSync(reportPaths.mtresultsJson, 'utf8'));
  const mutantData = jsonData[mutantHash]

  if (mutantData && mutantData !== undefined) {
    const txData = mutantData[txHash];
    if (txData && txData !== undefined) {
      if (field === "input") {
        return txData.tx.input;
      } else {
        return txData[field];
      }
    }
  }
  return null;
}

/**
 * Searches the "resultsJson" file for a transaction execution and extracts its data
 * @param {String} txHash -  the transaction hash
 * @param {String} field -  the name of the field to be read 
 * @returns the transaction data
 */
function readDataFromJson(txHash, field) {
  const jsonData = JSON.parse(fs.readFileSync(reportPaths.resultsJson, 'utf8'));
  const txData = jsonData[txHash];

  if (txData && txData !== undefined) {
    return txData[field];
  }

  return null;
}

/**
* Creates a timestamp in "hh.mm.ss" format 
* @param {Date} duration - the duration to be convered
* @returns a timestamp in "hh.mm.ss" format 
*/
function getTimestamp(duration) {
  hours = Math.floor(duration / (1000 * 60 * 60));
  minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  seconds = Math.floor((duration % (1000 * 60)) / 1000);

  return hours + "." + minutes + "." + seconds;
}

/**
* Parse a string of code to remove newlines
* @param {String} code - the sumo mutant object with additional fields related to replay testing
* @returns {String} the parsed code 
*/
function parseCode(code) {
  return code.replace(/\r?\n|\r/g, '');
}

/**
* Parse the status code of a replay testing session
* @param {Number} statusCode - the status code of a replay testing session
* @returns {String} a string describing the meaning of the status code
*/
function parseReplayStatusCode(statusCode) {
  switch (statusCode) {
    case 0: return "success-passed";
    case 1: return "success-failed";
    case 2: return "error-timeout-on-deployed";
    case 3: return "error-timeout-on-upgraded";
    case 4: return "error-missing-outcome";
    case 10: return "not-executed";    //uncompilable mutant
    case null: return "not-executed";
    default: return "error-unknown";
  }
}

/**
* Parse the outcome of the replay session for a given transaction
* @param {boolean} hasOutcomeChanged - whether the outcome of the transaction changed
* @param {boolean} hasStorageChanged -  whether the storage changed
* @param {number} replayStatusCode -  the replay status code


* @returns {String} a string describing the outcome of the replay session
*/
function getChangesDescription(hasOutcomeChanged, hasStorageChanged, replayStatusCode) {
  let replayOutcome;

  if (replayStatusCode !== 0 && replayStatusCode !== 1) {
    replayOutcome = "unknown";
  } else if (hasOutcomeChanged && hasStorageChanged) {
    replayOutcome = "outcome-storage-changed";
  } else if (hasOutcomeChanged) {
    replayOutcome = "outcome-changed";
  } else if (hasStorageChanged) {
    replayOutcome = "storage-changed";
  } else {
    replayOutcome = "none-changed";
  }
  return replayOutcome;
}

module.exports = {
  extractExecutionsCsv: extractExecutionsCsv,
  getTimestamp: getTimestamp,
  logReplayResultToCsv: logReplayResultToCsv,
  logMutantResultToCsv: logMutantResultToCsv,
  logResultToJson: logResultToJson,
  reportPaths: reportPaths,
  readDataFromMtJson: readDataFromMtJson,
  readDataFromJson: readDataFromJson,
  setupCatanaReports: setupCatanaReports,
  setupCatanaMtReports: setupCatanaMtReports
};