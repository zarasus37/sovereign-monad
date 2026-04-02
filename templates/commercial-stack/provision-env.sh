#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ensure_file() {
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

ensure_file "${SCRIPT_DIR}/.env.api" "${SCRIPT_DIR}/.env.api.example"
ensure_file "${SCRIPT_DIR}/.env.billing" "${SCRIPT_DIR}/.env.billing.example"
ensure_file "${SCRIPT_DIR}/.env.license-service" "${SCRIPT_DIR}/.env.license-service.example"
ensure_file "${SCRIPT_DIR}/.env.edge" "${SCRIPT_DIR}/.env.edge.example"

set -a
source "${SCRIPT_DIR}/.env.edge"
set +a

required_edge=(ROOT_DOMAIN API_DOMAIN BILLING_DOMAIN LICENSE_DOMAIN ACME_EMAIL)
for key in "${required_edge[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required edge value: ${key}" >&2
    exit 1
  fi
done

upsert_env "${SCRIPT_DIR}/.env.billing" "CHECKOUT_SUCCESS_URL" "https://${BILLING_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}"
upsert_env "${SCRIPT_DIR}/.env.billing" "CHECKOUT_CANCEL_URL" "https://${BILLING_DOMAIN}/cancel"
upsert_env "${SCRIPT_DIR}/.env.billing" "PORTAL_RETURN_URL" "https://${BILLING_DOMAIN}/account"
upsert_env "${SCRIPT_DIR}/.env.license-service" "PUBLIC_LICENSE_SERVER_URL" "https://${LICENSE_DOMAIN}"

echo "Environment provisioning complete."
echo "Derived public URLs from:"
echo "  API domain: ${API_DOMAIN}"
echo "  Billing domain: ${BILLING_DOMAIN}"
echo "  License domain: ${LICENSE_DOMAIN}"
