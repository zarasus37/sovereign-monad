#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LICENSE_ENV_FILE="${LICENSE_ENV_FILE:-${REPO_ROOT}/.env.license}"
MAIN_ENV_FILE="${MAIN_ENV_FILE:-${REPO_ROOT}/.env}"
MAIN_COMPOSE_FILE="${MAIN_COMPOSE_FILE:-docker-compose.mainnet.yml}"
LICENSED_COMPOSE_FILE="${LICENSED_COMPOSE_FILE:-docker-compose.licensed.yml}"

if [[ ! -f "${LICENSE_ENV_FILE}" ]]; then
  echo "Missing ${LICENSE_ENV_FILE}. Run ./scripts/activate-license.sh first."
  exit 1
fi

if [[ ! -f "${MAIN_ENV_FILE}" ]]; then
  echo "Missing ${MAIN_ENV_FILE}. Copy .env.example to .env and fill in runtime values first."
  exit 1
fi

set -a
source "${MAIN_ENV_FILE}"
set +a

"${SCRIPT_DIR}/validate-license.sh"

required_vars=(
  BASE_RPC_URL
  ARBITRUM_RPC_URL
  PRIVATE_KEY
  AERODROME_ROUTER
  CAMELOT_ROUTER
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}"
    echo "Populate your main .env file before deploying."
    exit 1
  fi
done

cd "${REPO_ROOT}"

echo "Previewing licensed compose configuration"
docker compose \
  --env-file "${MAIN_ENV_FILE}" \
  --env-file "${LICENSE_ENV_FILE}" \
  -f "${MAIN_COMPOSE_FILE}" \
  -f "${LICENSED_COMPOSE_FILE}" \
  config > /dev/null

echo "Building and starting licensed stack"
docker compose \
  --env-file "${MAIN_ENV_FILE}" \
  --env-file "${LICENSE_ENV_FILE}" \
  -f "${MAIN_COMPOSE_FILE}" \
  -f "${LICENSED_COMPOSE_FILE}" \
  up -d --build

echo "Deployment started"
echo "Run ./scripts/health-check.sh for a quick status summary"
