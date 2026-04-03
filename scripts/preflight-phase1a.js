const hre = require("hardhat");
const { ethers } = hre;
const { execFileSync } = require("child_process");
const path = require("path");
const { loadPhase1aConfig } = require("./phase1a-config");

function fail(message) {
  throw new Error(`Phase 1a preflight failed: ${message}`);
}

function warn(message) {
  console.warn(`Phase 1a preflight warning: ${message}`);
}

function normalizeChainId(value) {
  if (typeof value === "string") {
    return value.startsWith("0x") ? Number(BigInt(value)) : Number(value);
  }
  return Number(value);
}

function isPlaceholderAddress(address) {
  if (!address) return true;
  const normalized = address.toLowerCase();
  return [
    ethers.ZeroAddress.toLowerCase(),
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
  ].includes(normalized);
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (typeof error.status === "number") {
      return null;
    }
    throw error;
  }
}

function ensureNotTrackedOrStaged(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  const tracked = runGit(["ls-files", "--error-unmatch", relativePath]);
  if (tracked) {
    fail(`${relativePath} is tracked by git. Local deploy input files must remain untracked.`);
  }

  const staged = runGit(["diff", "--cached", "--name-only", "--", relativePath]);
  if (staged) {
    fail(`${relativePath} is staged in git. Unstage local deploy input files before proceeding.`);
  }
}

async function main() {
  const { configPath, config } = loadPhase1aConfig({ requireFile: hre.network.name !== "hardhat" });
  const [deployer, approvedSource, founder] = await ethers.getSigners();
  const envPath = path.resolve(process.cwd(), ".env.phase1a");

  if (hre.network.name !== "hardhat") {
    if (!process.env.PHASE1A_RPC_URL) {
      fail("PHASE1A_RPC_URL is required for live/networked preflight.");
    }
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      fail("DEPLOYER_PRIVATE_KEY is required for live/networked preflight.");
    }
  }

  const founderAddress = config.founderAddress || founder.address;
  const approvedSourceAddress = config.approvedSourceAddress || approvedSource.address;
  const expectedChainId = config.expectedChainId ?? (process.env.PHASE1A_CHAIN_ID ? Number(process.env.PHASE1A_CHAIN_ID) : 143);
  const minDeployerBalanceEth = config.minDeployerBalanceEth || "0";
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const derivedDeployerAddress = deployerPrivateKey
    ? new ethers.Wallet(deployerPrivateKey).address
    : deployer.address;

  ensureNotTrackedOrStaged(envPath);
  ensureNotTrackedOrStaged(configPath);

  if (!ethers.isAddress(founderAddress)) {
    fail(`invalid founderAddress: ${founderAddress}`);
  }

  if (!ethers.isAddress(approvedSourceAddress)) {
    fail(`invalid approvedSourceAddress: ${approvedSourceAddress}`);
  }

  if (isPlaceholderAddress(approvedSourceAddress)) {
    fail(`approvedSourceAddress is a zero/placeholder address: ${approvedSourceAddress}`);
  }

  const rpcChainHex = await ethers.provider.send("eth_chainId", []);
  const rpcChainId = normalizeChainId(rpcChainHex);
  const network = await ethers.provider.getNetwork();
  if (rpcChainId !== Number(expectedChainId)) {
    fail(`RPC returned chain ID ${rpcChainId}, expected ${expectedChainId}. Wrong network or wrong endpoint.`);
  }
  if (Number(network.chainId) !== rpcChainId) {
    fail(`provider/network mismatch: provider reports ${network.chainId}, eth_chainId returned ${rpcChainId}.`);
  }

  if (derivedDeployerAddress.toLowerCase() !== deployer.address.toLowerCase()) {
    fail(`deployer signer mismatch: signer resolved ${deployer.address}, private key resolved ${derivedDeployerAddress}.`);
  }

  if (process.env.PHASE1A_CONFIRM_DEPLOYER_ADDRESS !== derivedDeployerAddress) {
    fail(
      `deployer confirmation missing. Set PHASE1A_CONFIRM_DEPLOYER_ADDRESS=${derivedDeployerAddress} after manually confirming this is the correct wallet.`
    );
  }

  const deployerTxCount = await ethers.provider.getTransactionCount(derivedDeployerAddress);
  if (deployerTxCount === 0) {
    warn("Deployer address has no mainnet transaction history. Confirm this is intentional before proceeding.");
    if (process.env.PHASE1A_ACK_FRESH_DEPLOYER !== "true") {
      fail("fresh deployer acknowledgment missing. Set PHASE1A_ACK_FRESH_DEPLOYER=true if intentional.");
    }
  }

  if (founderAddress.toLowerCase() === derivedDeployerAddress.toLowerCase()) {
    warn("Founder address matches deployer address. This is valid only if intentional.");
    if (process.env.PHASE1A_ACK_FOUNDER_EQUALS_DEPLOYER !== "true") {
      fail("founder/deployer acknowledgment missing. Set PHASE1A_ACK_FOUNDER_EQUALS_DEPLOYER=true if intentional.");
    }
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
    rpcChainId,
    deployer: deployer.address,
    derivedDeployerAddress,
    deployerTxCount,
    founderAddress,
    approvedSourceAddress,
    approvedSourceLabel: config.approvedSourceLabel || "MonadSpin Provider",
    deployerBalanceEth: ethers.formatEther(deployerBalance),
    minDeployerBalanceEth: String(minDeployerBalanceEth),
    envPath,
    configPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
