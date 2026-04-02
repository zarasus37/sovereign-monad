/*
Test Metadata
Canonical Identity: phase1a.reconstruction.js
Canonical Role: executable Phase 1a reconstruction invariant suite
Provenance Status: reconstruction verification harness
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router specification + reconstructed Phase 1a contracts
Interpretation Rule: this block is compressed verification metadata; readers must decompress it into the specific canonical invariants each test is proving rather than treating the file as generic integration coverage.
*/

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1a reconstruction", function () {
  async function deploySystem({ doveFactory = "MockDove" } = {}) {
    const [owner, source, founder, delegateRecipient, outsider] = await ethers.getSigners();

    const Dove = await ethers.getContractFactory(doveFactory);
    const dove = await Dove.deploy();
    await dove.waitForDeployment();

    const GovernanceController = await ethers.getContractFactory("GovernanceController");
    const governance = await GovernanceController.deploy(await dove.getAddress(), owner.address);
    await governance.waitForDeployment();

    const InboundReceiver = await ethers.getContractFactory("InboundReceiver");
    const RevenueRouter = await ethers.getContractFactory("RevenueRouter");
    const RevenueSinkTreasury = await ethers.getContractFactory("RevenueSinkTreasury");
    const RevenueSinkMEV = await ethers.getContractFactory("RevenueSinkMEV");
    const RevenueSinkOpsDev = await ethers.getContractFactory("RevenueSinkOpsDev");
    const RevenueSinkDataYield = await ethers.getContractFactory("RevenueSinkDataYield");
    const RevenueSinkFounder = await ethers.getContractFactory("RevenueSinkFounder");
    const RevenueSinkDelegatePools = await ethers.getContractFactory("RevenueSinkDelegatePools");
    const DoveRouterObserver = await ethers.getContractFactory("DoveRouterObserver");

    const receiver = await InboundReceiver.deploy(await governance.getAddress(), await dove.getAddress());
    const router = await RevenueRouter.deploy(await governance.getAddress(), await dove.getAddress());
    const treasury = await RevenueSinkTreasury.deploy(await governance.getAddress(), await dove.getAddress());
    const mev = await RevenueSinkMEV.deploy(await governance.getAddress(), await dove.getAddress());
    const ops = await RevenueSinkOpsDev.deploy(await governance.getAddress(), await dove.getAddress());
    const dataYield = await RevenueSinkDataYield.deploy(await governance.getAddress(), await dove.getAddress());
    const founderSink = await RevenueSinkFounder.deploy(
      await governance.getAddress(),
      await dove.getAddress(),
      founder.address
    );
    const delegatePools = await RevenueSinkDelegatePools.deploy(
      await governance.getAddress(),
      await dove.getAddress()
    );
    const observer = await DoveRouterObserver.deploy(await governance.getAddress(), await dove.getAddress());

    for (const contract of [receiver, router, treasury, mev, ops, dataYield, founderSink, delegatePools, observer]) {
      await contract.waitForDeployment();
    }

    async function govExec(contract, fn, args = []) {
      const data = contract.interface.encodeFunctionData(fn, args);
      return governance.connect(owner).execute(await contract.getAddress(), 0, data);
    }

    await govExec(receiver, "setRouter", [await router.getAddress()]);
    for (const sink of [treasury, mev, ops, dataYield, founderSink, delegatePools]) {
      await govExec(sink, "setRouter", [await router.getAddress()]);
    }

    await govExec(router, "setReceiver", [await receiver.getAddress()]);
    await govExec(router, "registerSink", ["TREASURY", await treasury.getAddress(), true]);
    await govExec(router, "registerSink", ["MEV", await mev.getAddress(), true]);
    await govExec(router, "registerSink", ["OPS_DEV", await ops.getAddress(), true]);
    await govExec(router, "registerSink", ["DATA_YIELD", await dataYield.getAddress(), true]);
    await govExec(router, "registerSink", ["DELEGATE_POOLS", await delegatePools.getAddress(), true]);
    await govExec(router, "registerSink", ["FOUNDER", await founderSink.getAddress(), true]);
    await govExec(dataYield, "setMevSink", [await mev.getAddress()]);
    await govExec(mev, "setDataYieldSource", [await dataYield.getAddress()]);
    await govExec(receiver, "setApprovedSource", [source.address, true, "MonadSpin Provider"]);
    await govExec(
      observer,
      "initialize",
      [
        await receiver.getAddress(),
        await router.getAddress(),
        await treasury.getAddress(),
        await mev.getAddress(),
        await ops.getAddress(),
        await dataYield.getAddress(),
        await delegatePools.getAddress(),
        await founderSink.getAddress(),
      ]
    );

    return {
      owner,
      source,
      founder,
      delegateRecipient,
      outsider,
      dove,
      governance,
      receiver,
      router,
      treasury,
      mev,
      ops,
      dataYield,
      founderSink,
      delegatePools,
      observer,
      govExec,
    };
  }

  it("routes every wei atomically and preserves locked allocation policy", async function () {
    const system = await deploySystem();
    const amount = 10_000n;

    await expect(
      system.receiver.connect(system.source).receiveMonadSpinRevenue("2026-04-week-1", "0x", {
        value: amount,
      })
    ).to.changeEtherBalances(
      [
        system.source,
        system.receiver,
        system.router,
        system.treasury,
        system.mev,
        system.ops,
        system.dataYield,
        system.delegatePools,
        system.founderSink,
      ],
      [-amount, 0n, 0n, 4000n, 3500n, 1500n, 0n, 500n, 500n]
    );

    expect(await ethers.provider.getBalance(await system.treasury.getAddress())).to.equal(4000n);
    expect(await ethers.provider.getBalance(await system.mev.getAddress())).to.equal(3500n);
    expect(await ethers.provider.getBalance(await system.ops.getAddress())).to.equal(1500n);
    expect(await ethers.provider.getBalance(await system.delegatePools.getAddress())).to.equal(500n);
    expect(await ethers.provider.getBalance(await system.founderSink.getAddress())).to.equal(500n);
    expect(await ethers.provider.getBalance(await system.dataYield.getAddress())).to.equal(0n);
    expect(await system.router.allocationHistoryLength()).to.equal(1n);
  });

  it("reverts atomically if one sink is paused", async function () {
    const system = await deploySystem();

    await system.govExec(system.founderSink, "setPaused", [true]);

    await expect(
      system.receiver.connect(system.source).receiveMonadSpinRevenue("2026-04-week-1", "0x", {
        value: 10_000n,
      })
    ).to.be.reverted;

    for (const sink of [system.treasury, system.mev, system.ops, system.dataYield, system.delegatePools, system.founderSink]) {
      expect(await ethers.provider.getBalance(await sink.getAddress())).to.equal(0n);
    }
    expect(await system.router.allocationHistoryLength()).to.equal(0n);
  });

  it("rejects invalid allocation policy changes and treasury floor breaches", async function () {
    const system = await deploySystem();

    await expect(
      system.govExec(system.router, "updateAllocationPolicy", [3900, 2500, 1500, 1000, 500, 500])
    ).to.be.revertedWithCustomError(system.governance, "ExecutionFailed");

    await expect(
      system.govExec(system.router, "updateAllocationPolicy", [4000, 2500, 1500, 1000, 500, 600])
    ).to.be.revertedWithCustomError(system.governance, "ExecutionFailed");
  });

  it("locks receiver and router wiring after first set", async function () {
    const system = await deploySystem();

    await expect(
      system.govExec(system.receiver, "setRouter", [await system.router.getAddress()])
    ).to.be.revertedWithCustomError(system.governance, "ExecutionFailed");

    await expect(
      system.govExec(system.router, "setReceiver", [await system.receiver.getAddress()])
    ).to.be.revertedWithCustomError(system.governance, "ExecutionFailed");

    await expect(
      system.govExec(system.treasury, "setRouter", [await system.router.getAddress()])
    ).to.be.revertedWithCustomError(system.governance, "ExecutionFailed");
  });

  it("rejects silent ETH ingress across receiver, router, and sinks", async function () {
    const system = await deploySystem();
    const targets = [
      system.receiver,
      system.router,
      system.treasury,
      system.mev,
      system.ops,
      system.dataYield,
      system.delegatePools,
      system.founderSink,
    ];

    for (const target of targets) {
      await expect(
        system.owner.sendTransaction({
          to: await target.getAddress(),
          value: 1n,
        })
      ).to.be.reverted;
    }
  });

  it("keeps economic flow alive even if Dove observe calls always revert", async function () {
    const system = await deploySystem({ doveFactory: "RevertingDove" });

    await expect(
      system.receiver.connect(system.source).receiveMonadSpinRevenue("2026-04-week-1", "0x", {
        value: 10_000n,
      })
    ).to.not.be.reverted;

    expect(await ethers.provider.getBalance(await system.treasury.getAddress())).to.equal(4000n);
    expect(await ethers.provider.getBalance(await system.mev.getAddress())).to.equal(3500n);
    expect(await system.router.allocationHistoryLength()).to.equal(1n);
  });

  it("allows observer snapshots after initialization", async function () {
    const system = await deploySystem();

    await system.receiver.connect(system.source).receiveMonadSpinRevenue("2026-04-week-1", "0x", {
      value: 10_000n,
    });

    await expect(system.observer.snapshotRouterHealth())
      .to.emit(system.observer, "RouterHealthSnapshot")
      .withArgs(1n, 1n, 4000n, 3500n, 1500n, 0n, 500n, 500n);
  });
});
