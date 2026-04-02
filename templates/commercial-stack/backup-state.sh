#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_ENV_FILE="${HOST_ENV_FILE:-${SCRIPT_DIR}/.env.host}"

if [[ -f "${HOST_ENV_FILE}" ]]; then
  set -a
  source "${HOST_ENV_FILE}"
  set +a
fi

APP_ROOT="${APP_ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
BACKUP_ROOT="${BACKUP_ROOT:-${APP_ROOT}/backups}"

stack_dir="${APP_ROOT}/repo/templates/commercial-stack"
if [[ ! -d "${stack_dir}" ]]; then
  stack_dir="${SCRIPT_DIR}"
fi

api_keys="${stack_dir}/../api/config/api-keys.json"
licenses="${stack_dir}/../license-service/config/licenses.json"

for file in "${api_keys}" "${licenses}"; do
  if [[ ! -f "${file}" ]]; then
    echo "Missing required file: ${file}" >&2
    exit 1
  fi
done

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="${BACKUP_ROOT}/${timestamp}"
mkdir -p "${backup_dir}"

cp "${api_keys}" "${backup_dir}/api-keys.json"
cp "${licenses}" "${backup_dir}/licenses.json"

for env_name in .env.api .env.billing .env.license-service .env.edge .env.host; do
  if [[ -f "${stack_dir}/${env_name}" ]]; then
    cp "${stack_dir}/${env_name}" "${backup_dir}/${env_name}"
  fi
done

echo "${backup_dir}"
