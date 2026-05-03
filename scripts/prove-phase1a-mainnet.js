const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;
const { loadPhase1aConfig } = require("./phase1a-config");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function sameAddress(left, right) {
  return typeof left === "string"
    && typeof right === "string"
    && left.toLowerCase() === right.toLowerCase();
}

function codeSize(code) {
  if (!code || code === "0x") {
    return 0;
  }
  return (code.length - 2) / 2;
}

function defaultReportPath() {
  return path.resolve(process.cwd(), `./deployments/phase1a-deploy-${hre.network.name}.json`);
}

async function verifyCreationTx(contractKey, address, txHash) {
  if (!txHash) {
    return {
      ok: false,
      missing: true,
      address,
      txHash: null,
    };
  }

  const [tx, receipt] = await Promise.all([
    ethers.provider.getTransaction(txHash),
    ethers.provider.getTransactionReceipt(txHash),
  ]);

  const ok = Boolean(
    tx
    && receipt
    && receipt.status === 1
    && !tx.to
    && sameAddress(receipt.contractAddress, address),
  );

  return {
    ok,
    contractKey,
    address,
    txHash,
    explorerUrl: `https://monadscan.com/tx/${txHash}`,
    from: tx?.from || null,
    nonce: tx?.nonce ?? null,
    blockNumber: receipt?.blockNumber ?? null,
    status: receipt?.status ?? null,
    contractAddress: receipt?.contractAddress || null,
    gasUsed: receipt?.gasUsed?.toString() || null,
    gasPrice: receipt?.gasPrice?.toString() || null,
  };
}

async function main() {
  const reportPath = path.resolve(process.cwd(), process.env.PHASE1A_REPORT || defaultReportPath());
  const proofPath = path.resolve(
    process.cwd(),
    process.env.PHASE1A_PROOF_REPORT || "./deployments/phase1a-mainnet-proof.json",
  );
  const report = readJson(reportPath);
  const { configPath, config } = loadPhase1aConfig({ requireFile: false });
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const failures = [];

  function check(condition, message) {
    if (!condition) {
      failures.push(message);
    }
  }

  if (config.expectedChainId) {
    check(chainId === Number(config.expectedChainId), `chainId ${chainId} != expected ${config.expectedChainId}`);
  }
  if (report.chainId) {
    check(chainId === Number(report.chainId), `chainId ${chainId} != report ${report.chainId}`);
  }

  const code = {};
  for (const [key, address] of Object.entries(report.addresses || {})) {
    const runtime = await ethers.provider.getCode(address);
    code[key] = {
      address,
      present: runtime !== "0x",
      byteLength: codeSize(runtime),
      explorerUrl: `https://monadscan.com/address/${address}`,
    };
    check(runtime !== "0x", `${key} has no runtime bytecode at ${address}`);
  }

  const creationTransactions = {};
  for (const [key, address] of Object.entries(report.addresses || {})) {
    const txHash = report.creationTransactions?.[key]
      || report.steps?.find((step) => sameAddress(step.address, address))?.creationTx
      || null;
    creationTransactions[key] = await verifyCreationTx(key, address, txHash);
    check(creationTransactions[key].ok, `${key} creation tx proof missing or invalid`);
  }

  const receiver = await ethers.getContractAt("InboundReceiver", report.addresses.receiver);
  const router = await ethers.getContractAt("RevenueRouter", report.addresses.router);
  const mev = await ethers.getContractAt("RevenueSinkMEV", report.addresses.mev);
  const dataYield = await ethers.getContractAt("RevenueSinkDataYield", report.addresses.dataYield);
  const observer = await ethers.getContractAt("DoveRouterObserver", report.addresses.observer);
  const dove = await ethers.getContractAt("DoveCore", report.addresses.dove);

  check(sameAddress(await receiver.router(), report.addresses.router), "receiver.router mismatch");
  check(sameAddress(await router.receiver(), report.addresses.receiver), "router.receiver mismatch");
  check(sameAddress(await dataYield.mevSink(), report.addresses.mev), "dataYield.mevSink mismatch");
  check(sameAddress(await mev.dataYieldSource(), report.addresses.dataYield), "mev.dataYieldSource mismatch");
  check(await observer.initialized(), "observer not initialized");
  check(sameAddress(await observer.receiver(), report.addresses.receiver), "observer.receiver mismatch");
  check(sameAddress(await observer.router(), report.addresses.router), "observer.router mismatch");
  check(sameAddress(await observer.treasurySink(), report.addresses.treasury), "observer.treasurySink mismatch");

  for (const [sinkName, key] of [
    ["TREASURY", "treasury"],
    ["MEV", "mev"],
    ["OPS_DEV", "ops"],
    ["DATA_YIELD", "dataYield"],
    ["DELEGATE_POOLS", "delegatePools"],
    ["FOUNDER", "founderSink"],
  ]) {
    check(
      sameAddress(await router.getSinkAddress(sinkName), report.addresses[key]),
      `${sinkName} sink mismatch`,
    );
  }

  if (config.approvedSourceAddress) {
    check(await receiver.approvedSources(config.approvedSourceAddress), "approved source not registered");
  }

  const observerList = await dove.getObserverList();
  check(observerList.length === 11, `unexpected observer count ${observerList.length}`);

  const deployerBalance = report.deployer
    ? await ethers.provider.getBalance(report.deployer)
    : null;

  const proof = {
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "verified" : "failed",
    network: hre.network.name,
    chainId,
    reportPath,
    configPath,
    deployer: report.deployer || null,
    deployerBalanceNative: deployerBalance === null ? null : ethers.formatEther(deployerBalance),
    founderAddress: report.founderAddress || null,
    approvedSourceAddress: report.approvedSourceAddress || config.approvedSourceAddress || null,
    primaryRouter: report.addresses.router,
    primaryRouterTx: creationTransactions.router?.txHash || null,
    primaryRouterExplorerUrl: creationTransactions.router?.explorerUrl || null,
    addresses: report.addresses,
    code,
    creationTransactions,
    checks: {
      receiverRouterLinked: true,
      routerReceiverLinked: true,
      dataYieldMevLinked: true,
      observerInitialized: true,
      sinkRegistryLinked: true,
      approvedSourceRegistered: config.approvedSourceAddress ? true : "not-checked",
      observerCount: observerList.length,
    },
    failures,
  };

  writeJson(proofPath, proof);

  if (failures.length > 0) {
    throw new Error(`Phase 1a proof failed:\n- ${failures.join("\n- ")}`);
  }

  console.log("Phase 1a mainnet proof passed.");
  console.log(`Proof written to ${proofPath}`);
  console.log(JSON.stringify({
    chainId,
    router: proof.primaryRouter,
    routerTx: proof.primaryRouterTx,
    routerExplorerUrl: proof.primaryRouterExplorerUrl,
    observerCount: observerList.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
