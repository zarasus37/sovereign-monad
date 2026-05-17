const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const LIVE_REVENUE_ROUTER_ADDRESS = "0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982";

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer signer configured. Set DEPLOYER_PRIVATE_KEY in .env.phase1a or the shell.");
  }

  const network = await ethers.provider.getNetwork();
  const expectedChainId = Number(process.env.EMERGENCE_RECORDER_CHAIN_ID || process.env.PHASE1A_CHAIN_ID || 143);
  if (Number(network.chainId) !== expectedChainId) {
    throw new Error(`Wrong chain: connected ${network.chainId}, expected ${expectedChainId}.`);
  }

  const revenueRouter = process.env.EMERGENCE_RECORDER_REVENUE_ROUTER || LIVE_REVENUE_ROUTER_ADDRESS;
  const routerCode = await ethers.provider.getCode(revenueRouter);
  if (!routerCode || routerCode === "0x") {
    throw new Error(`RevenueRouter bytecode not found at ${revenueRouter}.`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deploying EmergenceRecorder from ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} MON`);
  console.log(`RevenueRouter: ${revenueRouter}`);

  const EmergenceRecorder = await ethers.getContractFactory("EmergenceRecorder", deployer);
  const recorder = await EmergenceRecorder.deploy(revenueRouter);
  const tx = recorder.deploymentTransaction();
  const receipt = tx ? await tx.wait() : null;
  if (!receipt || receipt.status !== 1) {
    throw new Error("EmergenceRecorder deployment failed.");
  }

  const address = await recorder.getAddress();
  const report = {
    generatedAt: new Date().toISOString(),
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    revenueRouter,
    emergenceRecorder: address,
    creationTxHash: tx.hash,
    deploymentBlockNumber: receipt.blockNumber,
    deploymentGasUsed: receipt.gasUsed.toString(),
    explorerUrl: `https://monadscan.com/tx/${tx.hash}`,
  };

  const outPath = path.resolve(process.cwd(), "deployments", `emergence-recorder-${hre.network.name}.json`);
  writeJson(outPath, report);

  console.log(`EmergenceRecorder deployed: ${address}`);
  console.log(`Creation tx: ${tx.hash}`);
  console.log(`Report: ${outPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
