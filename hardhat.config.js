require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

function loadEnvFile(fileName) {
  const filePath = path.resolve(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.phase1a");
loadEnvFile(".env");

const phase1aAccounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];
const phase1aChainId = process.env.PHASE1A_CHAIN_ID ? Number(process.env.PHASE1A_CHAIN_ID) : undefined;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {},
    phase1a: {
      url: process.env.PHASE1A_RPC_URL || "http://127.0.0.1:8545",
      chainId: phase1aChainId,
      accounts: phase1aAccounts
    }
  }
};
