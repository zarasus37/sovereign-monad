const fs = require("fs");
const path = require("path");

const SINK_REGISTRY = [
  ["TREASURY", "treasury"],
  ["MEV", "mev"],
  ["OPS_DEV", "ops"],
  ["DATA_YIELD", "dataYield"],
  ["DELEGATE_POOLS", "delegatePools"],
  ["FOUNDER", "founderSink"],
];

async function deployPhase1aSequence(hre, options = {}) {
  const { ethers } = hre;
  const signers = await ethers.getSigners();
  const [deployer, approvedSource, founder, engine, delegateRecipient, alternateGovernor] = signers;

  const ownerSigner = options.ownerSigner || deployer;
  const founderSigner = options.founderSigner || founder;
  const approvedSourceSigner = options.approvedSourceSigner || approvedSource;
  const founderAddress = options.founderAddress || founderSigner.address;
  const approvedSourceAddress = options.approvedSourceAddress || approvedSourceSigner.address;
  const approvedSourceLabel = options.approvedSourceLabel || "MonadSpin Provider";

  const steps = [];

  function record(step, label, extra = {}) {
    steps.push({ step, label, ...extra });
  }

  const DoveCore = await ethers.getContractFactory("DoveCore");
  const GovernanceController = await ethers.getContractFactory("GovernanceController");
  const InboundReceiver = await ethers.getContractFactory("InboundReceiver");
  const RevenueRouter = await ethers.getContractFactory("RevenueRouter");
  const RevenueSinkTreasury = await ethers.getContractFactory("RevenueSinkTreasury");
  const RevenueSinkMEV = await ethers.getContractFactory("RevenueSinkMEV");
  const RevenueSinkOpsDev = await ethers.getContractFactory("RevenueSinkOpsDev");
  const RevenueSinkDataYield = await ethers.getContractFactory("RevenueSinkDataYield");
  const RevenueSinkFounder = await ethers.getContractFactory("RevenueSinkFounder");
  const RevenueSinkDelegatePools = await ethers.getContractFactory("RevenueSinkDelegatePools");
  const DoveRouterObserver = await ethers.getContractFactory("DoveRouterObserver");

  const dove = await DoveCore.connect(ownerSigner).deploy(ownerSigner.address);
  await dove.waitForDeployment();
  record(1, "Deploy DoveCore.sol", { address: await dove.getAddress() });

  const governance = await GovernanceController.connect(ownerSigner).deploy(
    await dove.getAddress(),
    ownerSigner.address
  );
  await governance.waitForDeployment();
  record(2, "Deploy GovernanceController.sol(doveCore)", { address: await governance.getAddress() });

  await dove.connect(ownerSigner).registerObserver(await governance.getAddress(), "GovernanceController");
  record(3, "Register GovernanceController as observer");

  const receiver = await InboundReceiver.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await receiver.waitForDeployment();
  record(4, "Deploy InboundReceiver.sol", { address: await receiver.getAddress() });

  await dove.connect(ownerSigner).registerObserver(await receiver.getAddress(), "InboundReceiver");
  record(5, "Register InboundReceiver as observer");

  const treasury = await RevenueSinkTreasury.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await treasury.waitForDeployment();
  record(6, "Deploy RevenueSinkTreasury.sol", { address: await treasury.getAddress() });

  const mev = await RevenueSinkMEV.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await mev.waitForDeployment();
  record(7, "Deploy RevenueSinkMEV.sol", { address: await mev.getAddress() });

  const ops = await RevenueSinkOpsDev.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await ops.waitForDeployment();
  record(8, "Deploy RevenueSinkOpsDev.sol", { address: await ops.getAddress() });

  const dataYield = await RevenueSinkDataYield.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await dataYield.waitForDeployment();
  record(9, "Deploy RevenueSinkDataYield.sol", { address: await dataYield.getAddress() });

  const founderSink = await RevenueSinkFounder.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress(),
    founderAddress
  );
  await founderSink.waitForDeployment();
  record(10, "Deploy RevenueSinkFounder.sol", { address: await founderSink.getAddress() });

  const delegatePools = await RevenueSinkDelegatePools.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await delegatePools.waitForDeployment();
  record(11, "Deploy RevenueSinkDelegatePools.sol", { address: await delegatePools.getAddress() });

  const router = await RevenueRouter.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await router.waitForDeployment();
  record(12, "Deploy RevenueRouter.sol", { address: await router.getAddress() });

  async function govExec(contract, fn, args = []) {
    const data = contract.interface.encodeFunctionData(fn, args);
    return governance.connect(ownerSigner).execute(await contract.getAddress(), 0, data);
  }

  await dove.connect(ownerSigner).registerObserver(await router.getAddress(), "RevenueRouter");
  await dove.connect(ownerSigner).registerObserver(await treasury.getAddress(), "RevenueSinkTreasury");
  await dove.connect(ownerSigner).registerObserver(await mev.getAddress(), "RevenueSinkMEV");
  await dove.connect(ownerSigner).registerObserver(await ops.getAddress(), "RevenueSinkOpsDev");
  await dove.connect(ownerSigner).registerObserver(await dataYield.getAddress(), "RevenueSinkDataYield");
  await dove.connect(ownerSigner).registerObserver(await founderSink.getAddress(), "RevenueSinkFounder");
  await dove.connect(ownerSigner).registerObserver(await delegatePools.getAddress(), "RevenueSinkDelegatePools");
  record(13, "Register router and sinks as observers");

  for (const [sinkName, key] of SINK_REGISTRY) {
    await govExec(router, "registerSink", [sinkName, await ({ treasury, mev, ops, dataYield, delegatePools, founderSink })[key].getAddress(), true]);
  }
  record(14, "Initialize router sinks");

  await govExec(router, "setReceiver", [await receiver.getAddress()]);
  record(15, "Set receiver on router");

  await govExec(receiver, "setRouter", [await router.getAddress()]);
  for (const sink of [treasury, mev, ops, dataYield, founderSink, delegatePools]) {
    await govExec(sink, "setRouter", [await router.getAddress()]);
  }
  record(16, "Set router / receiver addresses across system");

  const observer = await DoveRouterObserver.connect(ownerSigner).deploy(
    await governance.getAddress(),
    await dove.getAddress()
  );
  await observer.waitForDeployment();
  record(17, "Deploy DoveRouterObserver.sol", { address: await observer.getAddress() });

  await dove.connect(ownerSigner).registerObserver(await observer.getAddress(), "DoveRouterObserver");
  record(18, "Register DoveRouterObserver");

  await govExec(observer, "initialize", [
    await receiver.getAddress(),
    await router.getAddress(),
    await treasury.getAddress(),
    await mev.getAddress(),
    await ops.getAddress(),
    await dataYield.getAddress(),
    await delegatePools.getAddress(),
    await founderSink.getAddress(),
  ]);
  record(19, "Initialize DoveRouterObserver with system addresses");

  await govExec(dataYield, "setMevSink", [await mev.getAddress()]);
  await govExec(mev, "setDataYieldSource", [await dataYield.getAddress()]);
  record(20, "Wire stipend / treasury references", {
    note: "Current reconstructed executable subset wires the DataYield -> MEV redirection linkage; no separate treasury-reference setter exists in the present Phase 1a contracts.",
  });

  await govExec(receiver, "setApprovedSource", [
    approvedSourceAddress,
    true,
    approvedSourceLabel,
  ]);
  record(21, "Register MonadSpin as approved source", { approvedSource: approvedSourceAddress, approvedSourceLabel });

  return {
    accounts: {
      owner: ownerSigner,
      approvedSource: approvedSourceSigner,
      founder: founderSigner,
      founderAddress,
      approvedSourceAddress,
      engine,
      delegateRecipient,
      alternateGovernor,
    },
    contracts: {
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
    },
    steps,
    govExec,
  };
}

function formatDeploymentReport(hre, system) {
  const report = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || null,
    generatedAt: new Date().toISOString(),
    deployer: system.accounts.owner.address,
    founderAddress: system.accounts.founderAddress,
    approvedSourceAddress: system.accounts.approvedSourceAddress,
    addresses: {},
    steps: system.steps,
  };

  for (const [name, contract] of Object.entries(system.contracts)) {
    report.addresses[name] = contract.target;
  }

  return report;
}

function writeDeploymentReport(report, fileName) {
  const outDir = path.join(process.cwd(), "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return outPath;
}

module.exports = {
  deployPhase1aSequence,
  formatDeploymentReport,
  writeDeploymentReport,
};
