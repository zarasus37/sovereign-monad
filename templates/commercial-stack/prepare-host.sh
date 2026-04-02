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

required_vars=(APP_ROOT APP_USER APP_GROUP)
for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required host env value: ${key}" >&2
    exit 1
  fi
done

if [[ "$(id -un)" != "${APP_USER}" ]]; then
  echo "prepare-host.sh should run as ${APP_USER}." >&2
  exit 1
fi

if [[ ! -d "${APP_ROOT}" ]]; then
  echo "Missing app root: ${APP_ROOT}" >&2
  exit 1
fi

install -d -m 0755 "${APP_ROOT}/repo"
install -d -m 0755 "${APP_ROOT}/shared/api-config"
install -d -m 0755 "${APP_ROOT}/shared/license-config"
install -d -m 0755 "${APP_ROOT}/backups"

if [[ ! -d "${APP_ROOT}/repo/.git" ]]; then
  if [[ -z "${GIT_REPO_URL:-}" ]]; then
    echo "GIT_REPO_URL is required to clone the repo." >&2
    exit 1
  fi

  if [[ "${GIT_REPO_URL}" == *"<your-user-or-org>"* ]]; then
    echo "GIT_REPO_URL still uses the placeholder value in .env.host." >&2
    exit 1
  fi

  git clone --branch "${GIT_BRANCH:-main}" --single-branch "${GIT_REPO_URL}" "${APP_ROOT}/repo"
fi

stack_dir="${APP_ROOT}/repo/templates/commercial-stack"

for env_name in .env.api .env.billing .env.license-service .env.edge; do
  if [[ ! -f "${stack_dir}/${env_name}" ]]; then
    cp "${stack_dir}/${env_name}.example" "${stack_dir}/${env_name}"
    echo "Prepared ${stack_dir}/${env_name}"
  fi
done

"${stack_dir}/provision-env.sh"

echo "Host preparation complete."
echo "Edit env files in ${stack_dir}, then run deploy-edge.sh."
