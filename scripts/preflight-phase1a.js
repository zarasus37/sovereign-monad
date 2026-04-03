const hre = require("hardhat");
const { ethers } = hre;
const { loadPhase1aConfig } = require("./phase1a-config");

function fail(message) {
  throw new Error(`Phase 1a preflight failed: ${message}`);
}

async function main() {
  const { configPath, config } = loadPhase1aConfig({ requireFile: hre.network.name !== "hardhat" });
  const [deployer, approvedSource, founder] = await ethers.getSigners();

  const founderAddress = config.founderAddress || founder.address;
  const approvedSourceAddress = config.approvedSourceAddress || approvedSource.address;
  const expectedChainId = config.expectedChainId ?? (process.env.PHASE1A_CHAIN_ID ? Number(process.env.PHASE1A_CHAIN_ID) : undefined);
  const minDeployerBalanceEth = config.minDeployerBalanceEth || "0";

  if (!ethers.isAddress(founderAddress)) {
    fail(`invalid founderAddress: ${founderAddress}`);
  }

  if (!ethers.isAddress(approvedSourceAddress)) {
    fail(`invalid approvedSourceAddress: ${approvedSourceAddress}`);
  }

  const network = await ethers.provider.getNetwork();
  if (expectedChainId !== undefined && Number(expectedChainId) !== Number(network.chainId)) {
    fail(`expected chainId ${expectedChainId}, got ${network.chainId}`);
  }

  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  const minBalanceWei = ethers.parseEther(String(minDeployerBalanceEth));
  if (deployerBalance < minBalanceWei) {
    fail(`deployer balance ${ethers.formatEther(deployerBalance)} ETH below minimum ${minDeployerBalanceEth} ETH`);
  }

  console.log("Phase 1a preflight passed.");
  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    founderAddress,
    approvedSourceAddress,
    approvedSourceLabel: config.approvedSourceLabel || "MonadSpin Provider",
    deployerBalanceEth: ethers.formatEther(deployerBalance),
    minDeployerBalanceEth: String(minDeployerBalanceEth),
    configPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
