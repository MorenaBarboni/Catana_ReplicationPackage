module.exports = {
    catanaDir: "./catana",
    sumoDir: "./sumo",
    transactionsPath: "./catana/transactions/transactions.json",
    DeployedSourcesDir: "./contracts/deployed",
    UpgradedSourcesDir: "./contracts",
    ProxyPath: "./contracts/TransparentUpgradeableProxy.sol",
    UpgradedLogicPath: "./contracts/BridgeMintableTokenV2.sol",
    DeployedProxyAddr: "0x4B19C70Da4c6fA4bAa0660825e889d2F7eaBc279",
    DeployedLogicAddr: "0x60a1B168CE980Ef69250362a66e40f8A7050Ce2F",
    stateVarsBlacklist: ["__gap", "_gap"],
    INFURA_KEY: "",
    ETHERSCAN_KEY: ""
}
