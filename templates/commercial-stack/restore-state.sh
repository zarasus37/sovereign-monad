#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-dir>" >&2
  exit 1
fi

backup_dir="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_ENV_FILE="${HOST_ENV_FILE:-${SCRIPT_DIR}/.env.host}"

if [[ -f "${HOST_ENV_FILE}" ]]; then
  set -a
  source "${HOST_ENV_FILE}"
  set +a
fi

APP_ROOT="${APP_ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
stack_dir="${APP_ROOT}/repo/templates/commercial-stack"
if [[ ! -d "${stack_dir}" ]]; then
  stack_dir="${SCRIPT_DIR}"
fi

if [[ ! -d "${backup_dir}" ]]; then
  echo "Missing backup directory: ${backup_dir}" >&2
  exit 1
fi

cp "${backup_dir}/api-keys.json" "${stack_dir}/../api/config/api-keys.json"
cp "${backup_dir}/inquiries.json" "${stack_dir}/../billing/config/inquiries.json"
cp "${backup_dir}/licenses.json" "${stack_dir}/../license-service/config/licenses.json"

for env_name in .env.api .env.billing .env.license-service .env.edge .env.host; do
  if [[ -f "${backup_dir}/${env_name}" ]]; then
    cp "${backup_dir}/${env_name}" "${stack_dir}/${env_name}"
  fi
done

echo "State restored from ${backup_dir}"
