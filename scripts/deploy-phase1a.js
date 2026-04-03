const hre = require("hardhat");
const {
  deployPhase1aSequence,
  formatDeploymentReport,
  writeDeploymentReport,
} = require("./phase1a-sequence");

async function main() {
  const system = await deployPhase1aSequence(hre);
  const report = formatDeploymentReport(hre, system);
  const outPath = writeDeploymentReport(report, `phase1a-deploy-${hre.network.name}.json`);

  console.log(`Phase 1a deployment sequence executed on ${hre.network.name}.`);
  console.log(`Report written to ${outPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
