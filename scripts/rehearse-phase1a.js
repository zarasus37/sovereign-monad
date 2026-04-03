const assert = require("assert");
const hre = require("hardhat");
const { ethers } = hre;
const {
  deployPhase1aSequence,
  formatDeploymentReport,
  writeDeploymentReport,
} = require("./phase1a-sequence");

async function main() {
  const system = await deployPhase1aSequence(hre);
  const { contracts, accounts } = system;

  await contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("rehearsal", "0x", {
    value: 10_000n,
  });

  const treasuryBalance = await ethers.provider.getBalance(await contracts.treasury.getAddress());
  const mevBalance = await ethers.provider.getBalance(await contracts.mev.getAddress());
  const opsBalance = await ethers.provider.getBalance(await contracts.ops.getAddress());
  const delegateBalance = await ethers.provider.getBalance(await contracts.delegatePools.getAddress());
  const founderBalance = await ethers.provider.getBalance(await contracts.founderSink.getAddress());
  const dataYieldBalance = await ethers.provider.getBalance(await contracts.dataYield.getAddress());

  assert.equal(treasuryBalance, 4000n);
  assert.equal(mevBalance, 3500n);
  assert.equal(opsBalance, 1500n);
  assert.equal(delegateBalance, 500n);
  assert.equal(founderBalance, 500n);
  assert.equal(dataYieldBalance, 0n);

  const report = {
    ...formatDeploymentReport(hre, system),
    rehearsal: {
      inflowWei: "10000",
      balancesWei: {
        treasury: treasuryBalance.toString(),
        mev: mevBalance.toString(),
        ops: opsBalance.toString(),
        dataYield: dataYieldBalance.toString(),
        delegatePools: delegateBalance.toString(),
        founder: founderBalance.toString(),
      },
      allocationHistoryLength: (await contracts.router.allocationHistoryLength()).toString(),
      inflowCount: (await contracts.receiver.inflowCount()).toString(),
    },
  };

  const outPath = writeDeploymentReport(report, `phase1a-rehearsal-${hre.network.name}.json`);

  console.log(`Phase 1a rehearsal succeeded on ${hre.network.name}.`);
  console.log(`Report written to ${outPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
