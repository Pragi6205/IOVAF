require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://0.0.0.0:7545",   // default Ganache RPC
      accounts: [
        "0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f",
        "0xc5be9951a3df8037a8a69d1c4397f51dd7c697125bd898b9b77f8f433a2f0e31"
      ]
    }
  }
};
