#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MAIN_ENV_FILE="${MAIN_ENV_FILE:-${REPO_ROOT}/.env}"
LICENSE_ENV_FILE="${LICENSE_ENV_FILE:-${REPO_ROOT}/.env.license}"

services=(
  zookeeper
  kafka
  base-market-agent
  arbitrum-market-agent
  spread-scanner
  opportunity-constructor
  risk-engine
  portfolio-manager
  arb-bot
  alert-rules
  dashboard
)

echo "== Licensed Stack Health =="

for service in "${services[@]}"; do
  container_id="$(
    docker compose \
      --env-file "${MAIN_ENV_FILE}" \
      --env-file "${LICENSE_ENV_FILE}" \
      -f "${REPO_ROOT}/docker-compose.mainnet.yml" \
      -f "${REPO_ROOT}/docker-compose.licensed.yml" \
      ps -q "${service}" 2>/dev/null || true
  )"

  if [[ -z "${container_id}" ]]; then
    echo "[missing] ${service}"
    continue
  fi

  running="$(docker inspect --format='{{.State.Running}}' "${container_id}" 2>/dev/null || echo false)"
  health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "${container_id}" 2>/dev/null || echo unknown)"

  echo "[running=${running}] [health=${health}] ${service}"
done
