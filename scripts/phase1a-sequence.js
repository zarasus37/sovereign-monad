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

function normalizeAddress(value) {
  return typeof value === "string" ? value.toLowerCase() : null;
}

function sameAddress(left, right) {
  return normalizeAddress(left) === normalizeAddress(right);
}

async function contractAddress(contract) {
  if (!contract) return null;
  if (typeof contract.getAddress === "function") {
    return contract.getAddress();
  }
  return contract.target || contract.address || null;
}

function getResumeAddress(resumeReport, key) {
  const candidate = resumeReport?.addresses?.[key];
  return typeof candidate === "string" && candidate ? candidate : null;
}

async function deployPhase1aSequence(hre, options = {}) {
  const { ethers } = hre;
  const signers = await ethers.getSigners();
  const [deployer, approvedSource, founder, engine, delegateRecipient, alternateGovernor] = signers;

  const ownerSigner = options.ownerSigner || deployer;
  const founderSigner = options.founderSigner || founder;
  const approvedSourceSigner = options.approvedSourceSigner || approvedSource;
  const founderAddress = options.founderAddress || founderSigner.address;
  const approvedSourceAddress = options.approvedSourceAddress || approvedSourceSigner.address;
  const approvedSourceLabel = options.approvedSourceLabel || "Bootstrap Revenue Source";
  const resumeReport = options.resumeReport || null;

  const steps = [];
  const system = {
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
    contracts: {},
    steps,
  };

  function record(step, label, extra = {}) {
    const next = { step, label, ...extra };
    const existingIndex = steps.findIndex((entry) => entry.step === step);
    if (existingIndex === -1) {
      steps.push(next);
      return;
    }
    steps[existingIndex] = { ...steps[existingIndex], label, ...extra };
  }

  async function publish(status = "in_progress", extra = {}) {
    if (typeof options.onProgress !== "function") {
      return;
    }
    await options.onProgress(formatDeploymentReport(hre, system, { status, ...extra }));
  }

  async function codeExists(address) {
    if (!address || !ethers.isAddress(address)) {
      return false;
    }
    return (await ethers.provider.getCode(address)) !== "0x";
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

  async function attachOrDeploy(factory, key, step, label, args = []) {
    const resumedAddress = getResumeAddress(resumeReport, key);
    if (await codeExists(resumedAddress)) {
      const contract = factory.attach(resumedAddress);
      system.contracts[key] = contract;
      record(step, label, { address: resumedAddress, resumed: true });
      await publish();
      return contract;
    }

    const contract = await factory.connect(ownerSigner).deploy(...args);
    await contract.waitForDeployment();
    const deployedAddress = await contractAddress(contract);
    system.contracts[key] = contract;
    record(step, label, { address: deployedAddress });
    await publish();
    return contract;
  }

  const dove = await attachOrDeploy(DoveCore, "dove", 1, "Deploy DoveCore.sol", [ownerSigner.address]);
  const governance = await attachOrDeploy(
    GovernanceController,
    "governance",
    2,
    "Deploy GovernanceController.sol(doveCore)",
    [await contractAddress(dove), ownerSigner.address],
  );

  async function ensureObserver(contract, observerLabel) {
    const address = await contractAddress(contract);
    const observerRecord = await dove.getObserver(address);

    if (observerRecord.active) {
      return { address, skipped: true, reason: "already-active", observerLabel };
    }

    if (observerRecord.registeredAt && observerRecord.registeredAt > 0n) {
      await dove.connect(ownerSigner).reactivateObserver(address);
      return { address, reactivated: true, observerLabel };
    }

    await dove.connect(ownerSigner).registerObserver(address, observerLabel);
    return { address, observerLabel };
  }

  record(
    3,
    "Register GovernanceController as observer",
    await ensureObserver(governance, "GovernanceController"),
  );
  await publish();

  const receiver = await attachOrDeploy(
    InboundReceiver,
    "receiver",
    4,
    "Deploy InboundReceiver.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );

  record(
    5,
    "Register InboundReceiver as observer",
    await ensureObserver(receiver, "InboundReceiver"),
  );
  await publish();

  const treasury = await attachOrDeploy(
    RevenueSinkTreasury,
    "treasury",
    6,
    "Deploy RevenueSinkTreasury.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );
  const mev = await attachOrDeploy(
    RevenueSinkMEV,
    "mev",
    7,
    "Deploy RevenueSinkMEV.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );
  const ops = await attachOrDeploy(
    RevenueSinkOpsDev,
    "ops",
    8,
    "Deploy RevenueSinkOpsDev.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );
  const dataYield = await attachOrDeploy(
    RevenueSinkDataYield,
    "dataYield",
    9,
    "Deploy RevenueSinkDataYield.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );
  const founderSink = await attachOrDeploy(
    RevenueSinkFounder,
    "founderSink",
    10,
    "Deploy RevenueSinkFounder.sol",
    [await contractAddress(governance), await contractAddress(dove), founderAddress],
  );
  const delegatePools = await attachOrDeploy(
    RevenueSinkDelegatePools,
    "delegatePools",
    11,
    "Deploy RevenueSinkDelegatePools.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );
  const router = await attachOrDeploy(
    RevenueRouter,
    "router",
    12,
    "Deploy RevenueRouter.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );

  async function govExec(contract, fn, args = []) {
    const data = contract.interface.encodeFunctionData(fn, args);
    return governance.connect(ownerSigner).execute(await contractAddress(contract), 0, data);
  }

  system.govExec = govExec;

  const observerResults = [];
  for (const [observerLabel, contract] of [
    ["RevenueRouter", router],
    ["RevenueSinkTreasury", treasury],
    ["RevenueSinkMEV", mev],
    ["RevenueSinkOpsDev", ops],
    ["RevenueSinkDataYield", dataYield],
    ["RevenueSinkFounder", founderSink],
    ["RevenueSinkDelegatePools", delegatePools],
  ]) {
    observerResults.push(await ensureObserver(contract, observerLabel));
  }
  record(13, "Register router and sinks as observers", { observerResults });
  await publish();

  for (const [sinkName, key] of SINK_REGISTRY) {
    const sinkAddress = await contractAddress(
      ({ treasury, mev, ops, dataYield, delegatePools, founderSink })[key],
    );
    if (!sameAddress(await router.getSinkAddress(sinkName), sinkAddress)) {
      await govExec(router, "registerSink", [sinkName, sinkAddress, true]);
    }
  }
  record(14, "Initialize router sinks");
  await publish();

  const receiverAddress = await contractAddress(receiver);
  const routerAddress = await contractAddress(router);

  const currentReceiver = await router.receiver();
  if (sameAddress(currentReceiver, receiverAddress)) {
    record(15, "Set receiver on router", { skipped: true, reason: "already-set" });
  } else {
    if (!sameAddress(currentReceiver, ethers.ZeroAddress)) {
      throw new Error(`router.receiver already set to unexpected address ${currentReceiver}`);
    }
    await govExec(router, "setReceiver", [receiverAddress]);
    record(15, "Set receiver on router");
  }
  await publish();

  for (const target of [receiver, treasury, mev, ops, dataYield, founderSink, delegatePools]) {
    const current = await target.router();
    if (sameAddress(current, routerAddress)) {
      continue;
    }
    if (!sameAddress(current, ethers.ZeroAddress)) {
      throw new Error(
        `router address already set to unexpected address ${current} on ${await contractAddress(target)}`,
      );
    }
    await govExec(target, "setRouter", [routerAddress]);
  }
  record(16, "Set router / receiver addresses across system");
  await publish();

  const observer = await attachOrDeploy(
    DoveRouterObserver,
    "observer",
    17,
    "Deploy DoveRouterObserver.sol",
    [await contractAddress(governance), await contractAddress(dove)],
  );

  record(18, "Register DoveRouterObserver", await ensureObserver(observer, "DoveRouterObserver"));
  await publish();

  if (await observer.initialized()) {
    record(19, "Initialize DoveRouterObserver with system addresses", {
      skipped: true,
      reason: "already-initialized",
    });
  } else {
    await govExec(observer, "initialize", [
      receiverAddress,
      routerAddress,
      await contractAddress(treasury),
      await contractAddress(mev),
      await contractAddress(ops),
      await contractAddress(dataYield),
      await contractAddress(delegatePools),
      await contractAddress(founderSink),
    ]);
    record(19, "Initialize DoveRouterObserver with system addresses");
  }
  await publish();

  if (!sameAddress(await dataYield.mevSink(), await contractAddress(mev))) {
    await govExec(dataYield, "setMevSink", [await contractAddress(mev)]);
  }
  if (!sameAddress(await mev.dataYieldSource(), await contractAddress(dataYield))) {
    await govExec(mev, "setDataYieldSource", [await contractAddress(dataYield)]);
  }
  record(20, "Wire stipend / treasury references", {
    note: "Current reconstructed executable subset wires the DataYield -> MEV redirection linkage; no separate treasury-reference setter exists in the present Phase 1a contracts.",
  });
  await publish();

  if (await receiver.approvedSources(approvedSourceAddress)) {
    record(21, "Register initial approved source", {
      approvedSource: approvedSourceAddress,
      approvedSourceLabel,
      skipped: true,
      reason: "already-approved",
      note: "Use a bootstrap source if the Stake-linked MonadSpin source is not yet deployed.",
    });
  } else {
    await govExec(receiver, "setApprovedSource", [
      approvedSourceAddress,
      true,
      approvedSourceLabel,
    ]);
    record(21, "Register initial approved source", {
      approvedSource: approvedSourceAddress,
      approvedSourceLabel,
      note: "Use a bootstrap source if the Stake-linked MonadSpin source is not yet deployed.",
    });
  }
  await publish();

  return system;
}

function formatDeploymentReport(hre, system, metadata = {}) {
  const report = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || null,
    generatedAt: new Date().toISOString(),
    status: metadata.status || "complete",
    deployer: system.accounts?.owner?.address || null,
    founderAddress: system.accounts?.founderAddress || null,
    approvedSourceAddress: system.accounts?.approvedSourceAddress || null,
    completedStep: system.steps.reduce((max, entry) => Math.max(max, entry.step || 0), 0),
    addresses: {},
    steps: system.steps,
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (key === "status") continue;
    report[key] = value;
  }

  for (const [name, contract] of Object.entries(system.contracts)) {
    const address = contract?.target || contract?.address || null;
    if (address) {
      report.addresses[name] = address;
    }
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
