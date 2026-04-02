#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DOMAIN="${1:-}"
ACME_EMAIL="${2:-}"

if [[ -z "${ROOT_DOMAIN}" || -z "${ACME_EMAIL}" ]]; then
  echo "Usage: $0 <root-domain> <acme-email>" >&2
  exit 1
fi

copy_if_missing() {
  local target="$1"
  local example="$2"

  if [[ ! -f "${target}" ]]; then
    cp "${example}" "${target}"
    echo "Prepared ${target}"
  fi
}

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "${file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >>"${file}"
  fi
}

copy_if_missing "${SCRIPT_DIR}/.env.api" "${SCRIPT_DIR}/.env.api.example"
copy_if_missing "${SCRIPT_DIR}/.env.billing" "${SCRIPT_DIR}/.env.billing.example"
copy_if_missing "${SCRIPT_DIR}/.env.license-service" "${SCRIPT_DIR}/.env.license-service.example"
copy_if_missing "${SCRIPT_DIR}/.env.edge" "${SCRIPT_DIR}/.env.edge.example"

upsert_env "${SCRIPT_DIR}/.env.edge" "ROOT_DOMAIN" "${ROOT_DOMAIN}"
upsert_env "${SCRIPT_DIR}/.env.edge" "API_DOMAIN" "api.${ROOT_DOMAIN}"
upsert_env "${SCRIPT_DIR}/.env.edge" "BILLING_DOMAIN" "billing.${ROOT_DOMAIN}"
upsert_env "${SCRIPT_DIR}/.env.edge" "LICENSE_DOMAIN" "licenses.${ROOT_DOMAIN}"
upsert_env "${SCRIPT_DIR}/.env.edge" "ACME_EMAIL" "${ACME_EMAIL}"

"${SCRIPT_DIR}/provision-env.sh"

echo "Production env seed complete."
