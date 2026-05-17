const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const {
  deployPhase1aSequence,
  formatDeploymentReport,
} = require("./phase1a-sequence");
const { loadPhase1aConfig } = require("./phase1a-config");

function resolveReportPath(fileName) {
  return path.resolve(process.cwd(), "deployments", fileName);
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return filePath;
}

async function main() {
  const { configPath, config } = loadPhase1aConfig({ requireFile: hre.network.name !== "hardhat" });
  const progressPath = resolveReportPath(`phase1a-progress-${hre.network.name}.json`);
  const finalPath = resolveReportPath(`phase1a-deploy-${hre.network.name}.json`);
  const resumeReportPath = process.env.PHASE1A_RESUME_REPORT
    ? path.resolve(process.cwd(), process.env.PHASE1A_RESUME_REPORT)
    : progressPath;
  const resumeReport = readJsonIfExists(resumeReportPath);

  let lastProgressReport = resumeReport;

  try {
    const system = await deployPhase1aSequence(hre, {
      ...config,
      resumeReport,
      onProgress: async (report) => {
        lastProgressReport = {
          ...report,
          configPath,
          checkpointPath: progressPath,
          resumeReportPath: fs.existsSync(resumeReportPath) ? resumeReportPath : null,
        };
        writeJson(progressPath, lastProgressReport);
      },
    });

    const report = {
      ...formatDeploymentReport(hre, system, { status: "complete" }),
      configPath,
      checkpointPath: progressPath,
      resumeReportPath: fs.existsSync(resumeReportPath) ? resumeReportPath : null,
    };

    writeJson(progressPath, report);
    writeJson(finalPath, report);

    console.log(`Phase 1a deployment sequence executed on ${hre.network.name}.`);
    console.log(`Config path: ${configPath}`);
    console.log(`Checkpoint written to ${progressPath}`);
    console.log(`Final report written to ${finalPath}`);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const failureReport = {
      ...(lastProgressReport || {
        network: hre.network.name,
        chainId: hre.network.config.chainId || null,
        generatedAt: new Date().toISOString(),
        status: "failed",
        steps: [],
        addresses: {},
      }),
      status: "failed",
      failedAt: new Date().toISOString(),
      errorMessage: error.message || String(error),
      configPath,
      checkpointPath: progressPath,
      resumeReportPath: fs.existsSync(resumeReportPath) ? resumeReportPath : null,
    };

    writeJson(progressPath, failureReport);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
