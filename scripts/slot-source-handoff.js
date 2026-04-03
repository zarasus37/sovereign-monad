const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

function loadConfig() {
  const rawPath = process.env.SLOT_SOURCE_HANDOFF_CONFIG || "./config/slot-source-handoff.json";
  const configPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Slot source handoff config not found: ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
  return { configPath, config: JSON.parse(raw) };
}

function requireAddress(label, value) {
  if (!ethers.isAddress(value)) {
    throw new Error(`${label} must be a valid address`);
  }
}

function resolveReportPath(rawPath) {
  const chosen = rawPath || "./deployments/phase1a-deploy-phase1a.json";
  return path.isAbsolute(chosen) ? chosen : path.resolve(process.cwd(), chosen);
}

async function main() {
  const { configPath, config } = loadConfig();
  const [deployer] = await ethers.getSigners();

  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    throw new Error("sources must be a non-empty array");
  }

  const network = await ethers.provider.getNetwork();
  if (config.chainId && Number(config.chainId) !== Number(network.chainId)) {
    throw new Error(`chainId mismatch: expected ${config.chainId}, got ${network.chainId}`);
  }

  const reportPath = resolveReportPath(config.deploymentReportPath);
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Deployment report not found: ${reportPath}`);
  }

  const deploymentReport = JSON.parse(fs.readFileSync(reportPath, "utf8").replace(/^\uFEFF/, ""));
  requireAddress("deploymentReport.addresses.governance", deploymentReport.addresses?.governance);
  requireAddress("deploymentReport.addresses.receiver", deploymentReport.addresses?.receiver);

  const governance = await ethers.getContractAt("GovernanceController", deploymentReport.addresses.governance);
  const receiver = await ethers.getContractAt("InboundReceiver", deploymentReport.addresses.receiver);

  const executions = [];
  for (const source of config.sources) {
    requireAddress("sources[].address", source.address);
    if (typeof source.approved !== "boolean") {
      throw new Error("sources[].approved must be boolean");
    }
    if (typeof source.label !== "string" || !source.label.trim()) {
      throw new Error("sources[].label must be a non-empty string");
    }

    const data = receiver.interface.encodeFunctionData("setApprovedSource", [
      source.address,
      source.approved,
      source.label,
    ]);

    const tx = await governance.connect(deployer).execute(await receiver.getAddress(), 0, data);
    const receipt = await tx.wait();
    executions.push({
      address: source.address,
      approved: source.approved,
      label: source.label,
      txHash: receipt.hash,
    });
  }

  const cutover = config.cutover || {};
  if (cutover.revokeBootstrapAfterCutover) {
    requireAddress("cutover.bootstrapSourceAddress", cutover.bootstrapSourceAddress);
    const revokeData = receiver.interface.encodeFunctionData("setApprovedSource", [
      cutover.bootstrapSourceAddress,
      false,
      "Bootstrap Source Revoked After Stake Cutover",
    ]);
    const revokeTx = await governance.connect(deployer).execute(await receiver.getAddress(), 0, revokeData);
    const revokeReceipt = await revokeTx.wait();
    executions.push({
      address: cutover.bootstrapSourceAddress,
      approved: false,
      label: "Bootstrap Source Revoked After Stake Cutover",
      txHash: revokeReceipt.hash,
    });
  }

  const outputReport = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployedBy: deployer.address,
    configPath,
    deploymentReportPath: reportPath,
    governanceAddress: deploymentReport.addresses.governance,
    receiverAddress: deploymentReport.addresses.receiver,
    executions,
  };

  const outDir = path.resolve(process.cwd(), "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `slot-source-handoff-${hre.network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(outputReport, null, 2) + "\n", "utf8");

  console.log(`Slot source handoff executed on ${hre.network.name}.`);
  console.log(`Report written to ${outPath}`);
  console.log(JSON.stringify(outputReport, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
