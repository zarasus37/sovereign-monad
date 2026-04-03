const fs = require("fs");
const path = require("path");

function resolveConfigPath() {
  const raw = process.env.PHASE1A_CONFIG || "./config/phase1a.deploy.json";
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function loadPhase1aConfig({ requireFile = false } = {}) {
  const configPath = resolveConfigPath();

  if (!fs.existsSync(configPath)) {
    if (requireFile) {
      throw new Error(`Phase 1a config not found: ${configPath}`);
    }
    return { configPath, config: {} };
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { configPath, config: parsed };
}

module.exports = {
  resolveConfigPath,
  loadPhase1aConfig,
};
