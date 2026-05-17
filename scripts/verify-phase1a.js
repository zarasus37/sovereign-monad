const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;
const { loadPhase1aConfig } = require("./phase1a-config");

function loadReport() {
  const raw = process.env.PHASE1A_REPORT || path.resolve(process.cwd(), `./deployments/phase1a-deploy-${hre.network.name}.json`);
  if (!fs.existsSync(raw)) {
    throw new Error(`Phase 1a report not found: ${raw}`);
  }
  return { reportPath: raw, report: JSON.parse(fs.readFileSync(raw, "utf8")) };
}

async function main() {
  const { reportPath, report } = loadReport();
  const { configPath, config } = loadPhase1aConfig({ requireFile: false });

  const receiver = await ethers.getContractAt("InboundReceiver", report.addresses.receiver);
  const router = await ethers.getContractAt("RevenueRouter", report.addresses.router);
  const mev = await ethers.getContractAt("RevenueSinkMEV", report.addresses.mev);
  const dataYield = await ethers.getContractAt("RevenueSinkDataYield", report.addresses.dataYield);
  const observer = await ethers.getContractAt("DoveRouterObserver", report.addresses.observer);
  const dove = await ethers.getContractAt("DoveCore", report.addresses.dove);

  const failures = [];

  function check(condition, message) {
    if (!condition) failures.push(message);
  }

  check((await receiver.router()) === report.addresses.router, "receiver.router mismatch");
  check((await router.receiver()) === report.addresses.receiver, "router.receiver mismatch");
  check((await dataYield.mevSink()) === report.addresses.mev, "dataYield.mevSink mismatch");
  check((await mev.dataYieldSource()) === report.addresses.dataYield, "mev.dataYieldSource mismatch");
  check(await observer.initialized(), "observer not initialized");
  check((await observer.receiver()) === report.addresses.receiver, "observer.receiver mismatch");
  check((await observer.router()) === report.addresses.router, "observer.router mismatch");
  check((await observer.treasurySink()) === report.addresses.treasury, "observer.treasurySink mismatch");

  check((await router.getSinkAddress("TREASURY")) === report.addresses.treasury, "TREASURY sink mismatch");
  check((await router.getSinkAddress("MEV")) === report.addresses.mev, "MEV sink mismatch");
  check((await router.getSinkAddress("OPS_DEV")) === report.addresses.ops, "OPS_DEV sink mismatch");
  check((await router.getSinkAddress("DATA_YIELD")) === report.addresses.dataYield, "DATA_YIELD sink mismatch");
  check((await router.getSinkAddress("DELEGATE_POOLS")) === report.addresses.delegatePools, "DELEGATE_POOLS sink mismatch");
  check((await router.getSinkAddress("FOUNDER")) === report.addresses.founderSink, "FOUNDER sink mismatch");

  if (config.approvedSourceAddress) {
    check(await receiver.approvedSources(config.approvedSourceAddress), "approved source not registered");
  }

  const observerList = await dove.getObserverList();
  check(observerList.length === 11, `unexpected observer count ${observerList.length}`);

  if (failures.length > 0) {
    throw new Error(`Phase 1a verification failed:\n- ${failures.join("\n- ")}`);
  }

  console.log("Phase 1a deployment verification passed.");
  console.log(JSON.stringify({
    network: hre.network.name,
    reportPath,
    configPath,
    checks: {
      receiverRouterLinked: true,
      routerReceiverLinked: true,
      dataYieldMevLinked: true,
      observerInitialized: true,
      sinkRegistryLinked: true,
      approvedSourceRegistered: config.approvedSourceAddress ? true : "not-checked",
      observerCount: observerList.length,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
