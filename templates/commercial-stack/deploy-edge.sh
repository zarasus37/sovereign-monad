#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_ENV_FILE="${HOST_ENV_FILE:-${SCRIPT_DIR}/.env.host}"

if [[ ! -f "${HOST_ENV_FILE}" ]]; then
  echo "Missing host env file: ${HOST_ENV_FILE}" >&2
  echo "Copy .env.host.example to .env.host and fill in the values." >&2
  exit 1
fi

set -a
source "${HOST_ENV_FILE}"
set +a

stack_dir="${APP_ROOT}/repo/templates/commercial-stack"

if [[ ! -d "${stack_dir}" ]]; then
  echo "Missing commercial stack directory: ${stack_dir}" >&2
  exit 1
fi

cd "${stack_dir}"

required_files=(
  .env.api
  .env.billing
  .env.license-service
  .env.edge
  ../api/config/api-keys.json
  ../license-service/config/licenses.json
)

for file in "${required_files[@]}"; do
  if [[ ! -f "${file}" ]]; then
    echo "Missing required file: ${stack_dir}/${file}" >&2
    exit 1
  fi
done

if git -C "${APP_ROOT}/repo" remote get-url origin >/dev/null 2>&1; then
  git -C "${APP_ROOT}/repo" fetch origin "${GIT_BRANCH:-main}"
  git -C "${APP_ROOT}/repo" checkout "${GIT_BRANCH:-main}"
  git -C "${APP_ROOT}/repo" pull --ff-only origin "${GIT_BRANCH:-main}"
else
  echo "No git remote named origin found; deploying the existing repo checkout."
fi

"${stack_dir}/provision-env.sh"
backup_dir="$("${stack_dir}/backup-state.sh")"

docker compose -f docker-compose.yml -f docker-compose.edge.yml config >/dev/null
docker compose -f docker-compose.yml -f docker-compose.edge.yml up -d --build

echo "Commercial edge deployment complete."
echo "Backups stored in ${backup_dir}"
echo "Next step: verify https://${API_DOMAIN:-api.<root-domain>}/health"
