#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LICENSE_ENV_FILE="${LICENSE_ENV_FILE:-${REPO_ROOT}/.env.license}"

if [[ ! -f "${LICENSE_ENV_FILE}" ]]; then
  echo "Missing ${LICENSE_ENV_FILE}. Run ./scripts/activate-license.sh first."
  exit 1
fi

set -a
source "${LICENSE_ENV_FILE}"
set +a

if [[ "${LICENSE_ACTIVATED:-}" != "true" ]]; then
  echo "License file does not contain LICENSE_ACTIVATED=true"
  exit 1
fi

if [[ -z "${LICENSE_KEY:-}" ]]; then
  echo "License file is missing LICENSE_KEY"
  exit 1
fi

LICENSE_SERVER_URL="${LICENSE_SERVER_URL:-http://localhost:4010}"
VALIDATION_URL="${LICENSE_VALIDATION_URL:-${LICENSE_SERVER_URL%/}/licenses/validate}"
MACHINE_ID="${LICENSE_MACHINE_ID:-$(hostname)}"

tmp_response="$(mktemp)"
trap 'rm -f "${tmp_response}"' EXIT

http_code="$(
  curl --silent --show-error \
    --output "${tmp_response}" \
    --write-out "%{http_code}" \
    --request POST \
    --header "Content-Type: application/json" \
    --data "{\"licenseKey\":\"${LICENSE_KEY}\",\"machineId\":\"${MACHINE_ID}\",\"activationId\":\"${LICENSE_ACTIVATION_ID:-}\"}" \
    "${VALIDATION_URL}"
)"

if [[ "${http_code}" != "200" ]]; then
  echo "License validation failed with HTTP ${http_code}"
  cat "${tmp_response}"
  exit 1
fi

echo "License validation passed"
