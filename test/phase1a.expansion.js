/*
Test Metadata
Canonical Identity: phase1a.expansion.js
Canonical Role: deeper Phase 1a invariant and deployment-sequence rehearsal suite
Provenance Status: reconstruction verification harness expansion
Reconstruction Basis: MOF v2.3.0 + reconstructed Phase 1a contracts + locked deployment sequence
Interpretation Rule: this block is compressed verification metadata; readers must decompress it into governance, deployment, approved-source, and sink-withdrawal invariants rather than treating it as generic positive-path coverage.
*/

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployPhase1aSequence, formatDeploymentReport } = require("../scripts/phase1a-sequence");

describe("Phase 1a expanded invariants", function () {
  it("executes the locked deployment sequence and leaves the system fully wired", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, steps, accounts } = system;

    expect(steps.map((step) => step.step)).to.deep.equal([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);

    expect(await contracts.receiver.router()).to.equal(await contracts.router.getAddress());
    expect(await contracts.router.receiver()).to.equal(await contracts.receiver.getAddress());
    expect(await contracts.dataYield.mevSink()).to.equal(await contracts.mev.getAddress());
    expect(await contracts.mev.dataYieldSource()).to.equal(await contracts.dataYield.getAddress());
    expect(await contracts.receiver.approvedSources(accounts.approvedSource.address)).to.equal(true);

    const observerList = await contracts.dove.getObserverList();
    expect(observerList.length).to.equal(11);
  });

  it("resumes safely from a deployment checkpoint without redeploying or rewiring", async function () {
    const firstPass = await deployPhase1aSequence(require("hardhat"));
    const resumeReport = formatDeploymentReport(require("hardhat"), firstPass);
    const resumed = await deployPhase1aSequence(require("hardhat"), { resumeReport });

    expect(resumed.steps.map((step) => step.step)).to.deep.equal([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);

    expect(await resumed.contracts.dove.getAddress()).to.equal(await firstPass.contracts.dove.getAddress());
    expect(await resumed.contracts.receiver.getAddress()).to.equal(await firstPass.contracts.receiver.getAddress());
    expect(await resumed.contracts.router.getAddress()).to.equal(await firstPass.contracts.router.getAddress());
    expect(resumed.steps.find((step) => step.step === 1)?.resumed).to.equal(true);
    expect(resumed.steps.find((step) => step.step === 15)?.skipped).to.equal(true);
    expect(resumed.steps.find((step) => step.step === 18)?.skipped).to.equal(true);
    expect(resumed.steps.find((step) => step.step === 21)?.skipped).to.equal(true);
    expect(await resumed.contracts.receiver.approvedSources(firstPass.accounts.approvedSource.address)).to.equal(true);
  });

  it("enforces approved-source lifecycle and receiver pause gates", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, accounts, govExec } = system;

    await expect(
      contracts.receiver.connect(accounts.engine).receiveMonadSpinRevenue("blocked", "0x", { value: 10_000n })
    )
      .to.be.revertedWithCustomError(contracts.receiver, "NotApprovedSource")
      .withArgs(accounts.engine.address);

    await govExec(contracts.receiver, "setApprovedSource", [accounts.approvedSource.address, false, "revoked"]);
    await expect(
      contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("revoked", "0x", { value: 10_000n })
    )
      .to.be.revertedWithCustomError(contracts.receiver, "NotApprovedSource")
      .withArgs(accounts.approvedSource.address);

    await govExec(contracts.receiver, "setApprovedSource", [accounts.approvedSource.address, true, "restored"]);
    await govExec(contracts.receiver, "setPaused", [true]);
    await expect(
      contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("paused", "0x", { value: 10_000n })
    ).to.be.revertedWithCustomError(contracts.receiver, "ReceiverPaused");

    await govExec(contracts.receiver, "setPaused", [false]);
    await expect(
      contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("resumed", "0x", { value: 10_000n })
    ).to.not.be.reverted;
  });

  it("allows governance emergency pause on router and resumes cleanly after unpause", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, accounts } = system;

    await contracts.governance.connect(accounts.owner).setEmergencyPause(await contracts.router.getAddress(), true);
    await expect(
      contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("router-paused", "0x", {
        value: 10_000n,
      })
    ).to.be.reverted;

    await contracts.governance.connect(accounts.owner).setEmergencyPause(await contracts.router.getAddress(), false);
    await expect(
      contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("router-unpaused", "0x", {
        value: 10_000n,
      })
    ).to.not.be.reverted;
  });

  it("enforces founder withdrawal boundaries and governance-controlled draw pause", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, accounts, govExec } = system;

    await contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("founder", "0x", {
      value: 10_000n,
    });

    await expect(() =>
      contracts.founderSink.connect(accounts.founder).withdraw(500n)
    ).to.changeEtherBalances([accounts.founder, contracts.founderSink], [500n, -500n]);

    await govExec(contracts.founderSink, "setDrawsPaused", [true]);
    await expect(
      contracts.founderSink.connect(accounts.founder).withdraw(1n)
    ).to.be.revertedWithCustomError(contracts.founderSink, "DrawsPaused");

    await expect(
      contracts.founderSink.connect(accounts.engine).withdraw(1n)
    ).to.be.revertedWithCustomError(contracts.founderSink, "NotFounder");
  });

  it("keeps MEV, delegate, and ops outflows under governance-only control", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, accounts, govExec } = system;

    await contracts.receiver.connect(accounts.approvedSource).receiveMonadSpinRevenue("ops", "0x", {
      value: 10_000n,
    });

    await expect(
      contracts.mev.connect(accounts.engine).withdrawToEngine(accounts.engine.address, 1n)
    ).to.be.revertedWithCustomError(contracts.mev, "NotGovernance");
    await expect(
      contracts.delegatePools.connect(accounts.engine).distribute(accounts.delegateRecipient.address, 1n, "tier-1")
    ).to.be.revertedWithCustomError(contracts.delegatePools, "NotGovernance");
    await expect(
      contracts.ops.connect(accounts.engine).withdrawOps(accounts.engine.address, 1n, "memo")
    ).to.be.revertedWithCustomError(contracts.ops, "NotGovernance");

    await expect(() =>
      govExec(contracts.mev, "withdrawToEngine", [accounts.engine.address, 250n])
    ).to.changeEtherBalances([accounts.engine, contracts.mev], [250n, -250n]);

    await expect(() =>
      govExec(contracts.delegatePools, "distribute", [accounts.delegateRecipient.address, 500n, "tier-1"])
    ).to.changeEtherBalances([accounts.delegateRecipient, contracts.delegatePools], [500n, -500n]);

    await expect(() =>
      govExec(contracts.ops, "withdrawOps", [accounts.engine.address, 250n, "ops-test"])
    ).to.changeEtherBalances([accounts.engine, contracts.ops], [250n, -250n]);
  });

  it("supports executor delegation, ownership transfer, and observer initialization lock", async function () {
    const system = await deployPhase1aSequence(require("hardhat"));
    const { contracts, accounts } = system;

    await contracts.governance.connect(accounts.owner).setExecutor(accounts.alternateGovernor.address, true);

    const data = contracts.receiver.interface.encodeFunctionData("setApprovedSource", [
      accounts.engine.address,
      true,
      "executor-approved",
    ]);

    await expect(
      contracts.governance.connect(accounts.alternateGovernor).execute(
        await contracts.receiver.getAddress(),
        0,
        data
      )
    ).to.not.be.reverted;
    expect(await contracts.receiver.approvedSources(accounts.engine.address)).to.equal(true);

    await expect(
      contracts.observer.initialize(
        await contracts.receiver.getAddress(),
        await contracts.router.getAddress(),
        await contracts.treasury.getAddress(),
        await contracts.mev.getAddress(),
        await contracts.ops.getAddress(),
        await contracts.dataYield.getAddress(),
        await contracts.delegatePools.getAddress(),
        await contracts.founderSink.getAddress()
      )
    ).to.be.revertedWithCustomError(contracts.observer, "NotGovernance");

    await contracts.governance.connect(accounts.owner).transferOwnership(accounts.alternateGovernor.address);

    await expect(
      contracts.governance.connect(accounts.owner).setExecutor(accounts.engine.address, true)
    ).to.be.revertedWithCustomError(contracts.governance, "NotOwner");

    await expect(
      contracts.governance.connect(accounts.alternateGovernor).setExecutor(accounts.engine.address, true)
    ).to.not.be.reverted;
  });
});
