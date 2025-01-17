#!/usr/bin/env node
const chalk = require('chalk')
const yargs = require('yargs')
const index = require('./index.js');
const fetchProcessingData = require('./fetchProcessingData.js');
const scraper = require('./scraper.js');

yargs
  .usage('$0 <cmd> [args]')
  .command('setup', 'test setup', index.testSetup)
  .command('clean', 'clean the testing environment', index.cleanEnv)
  .command('capture <nTx> [startBlock]', 'Extracts nTx executed on the proxy and saves them to catana/transactions.json', (yargs) => {
    yargs
      .positional('nTx', {
        type: 'Number',
        describe: 'the number of transactions to be extracted',
        example: '40'
      })
      .positional('startBlock', {
        type: 'Number',
        describe: 'the startBlock (optional)',
        example: '1'
      })
  }, (argv) => {
    fetchProcessingData.captureProxyTxs(argv.nTx, argv.startBlock)
  })
  .command('replay <strategy>', 'replay the available transactions on the USC', (yargs) => {
    yargs
      .positional('strategy', {
        type: 'string',
        describe: 'replay strategy (txHash, all)',
        example: 'all'
      })
  }, (argv) => {
    index.replay(argv.strategy)
  })
  .command('replayMutants <strategy> [mutantHash]', 'replay the transaction on the mutants', (yargs) => {
    yargs
      .positional('strategy', {
        type: 'string',
        describe: 'replay strategy (txHash, or all)',
        example: 'all'
      })
      .positional('mutantHash', {
        type: 'string',
        describe: 'hash of the mutant to be tested (optional)',
      })
  }, (argv) => {
    index.replayOnMutants(argv.strategy, argv.mutantHash)
  })
  .command('scrape <txHash>', 'Scrape State Diff caused by a transaction from Etherscan', (yargs) => {
    yargs
      .positional('txHash', {
        type: 'string',
        describe: 'transaction hash',
        example: '0x123...'
      })
  }, (argv) => {
    scraper.scrapePage(argv.txHash)
  })
  .help()
  .alias('h', 'help')
  .demandCommand(1, 'You must specify a command.')
  .strict()
  .fail((msg, err, yargs) => {
    if (msg) console.error(chalk.red(msg));
    if (err) console.error(err);
    yargs.showHelp();
    process.exit(1);
  })
  .argv;