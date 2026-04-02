#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LICENSE_ENV_FILE="${LICENSE_ENV_FILE:-${REPO_ROOT}/.env.license}"
LICENSE_KEY="${1:-${LICENSE_KEY:-}}"
LICENSE_SERVER_URL="${LICENSE_SERVER_URL:-http://localhost:4010}"
ACTIVATION_URL="${LICENSE_ACTIVATION_URL:-${LICENSE_SERVER_URL%/}/licenses/activate}"
MACHINE_ID="${LICENSE_MACHINE_ID:-$(hostname)}"

if [[ -z "${LICENSE_KEY}" ]]; then
  echo "Usage: ${0##*/} YOUR_LICENSE_KEY"
  exit 1
fi

echo "Activating commercial license against ${ACTIVATION_URL}"

tmp_response="$(mktemp)"
trap 'rm -f "${tmp_response}"' EXIT

http_code="$(
  curl --silent --show-error \
    --output "${tmp_response}" \
    --write-out "%{http_code}" \
    --request POST \
    --header "Content-Type: application/json" \
    --header "Accept: text/plain" \
    --data "{\"licenseKey\":\"${LICENSE_KEY}\",\"machineId\":\"${MACHINE_ID}\"}" \
    "${ACTIVATION_URL}"
)"

if [[ "${http_code}" != "200" ]]; then
  echo "License activation failed with HTTP ${http_code}"
  cat "${tmp_response}"
  exit 1
fi

grep -q '^LICENSE_ACTIVATED=true$' "${tmp_response}" || {
  echo "Activation response did not confirm LICENSE_ACTIVATED=true"
  cat "${tmp_response}"
  exit 1
}

cp "${tmp_response}" "${LICENSE_ENV_FILE}"

echo "License activated. Wrote ${LICENSE_ENV_FILE}"
echo "Next step: ./scripts/deploy-licensed.sh"
