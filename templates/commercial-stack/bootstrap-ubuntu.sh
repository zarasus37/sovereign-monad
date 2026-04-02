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

if [[ "${EUID}" -ne 0 ]]; then
  echo "bootstrap-ubuntu.sh must run as root." >&2
  exit 1
fi

required_vars=(APP_ROOT APP_USER APP_GROUP SSH_PORT TZ)
for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required host env value: ${key}" >&2
    exit 1
  fi
done

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y \
  ca-certificates \
  curl \
  fail2ban \
  git \
  gnupg \
  jq \
  lsb-release \
  ufw

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

arch="$(dpkg --print-architecture)"
release="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${release} stable
EOF

apt-get update
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

timedatectl set-timezone "${TZ}"

if ! getent group "${APP_GROUP}" >/dev/null; then
  groupadd --system "${APP_GROUP}"
fi

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --gid "${APP_GROUP}" --shell /bin/bash "${APP_USER}"
fi

usermod -aG docker "${APP_USER}"

install -d -m 0755 -o "${APP_USER}" -g "${APP_GROUP}" "${APP_ROOT}"
install -d -m 0755 -o "${APP_USER}" -g "${APP_GROUP}" "${APP_ROOT}/backups"

systemctl enable --now docker
systemctl enable --now fail2ban

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat <<EOF
Ubuntu host bootstrap complete.

App user: ${APP_USER}
App root: ${APP_ROOT}
SSH port: ${SSH_PORT}
Timezone: ${TZ}

Next step:
  1. Copy the repo or pull it into ${APP_ROOT}
  2. Copy .env.host.example to .env.host
  3. Run prepare-host.sh as ${APP_USER}
EOF
