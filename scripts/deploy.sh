#!/usr/bin/env bash
# Deploy socmed-test-app to alloro-asia.
# Usage: ./scripts/deploy.sh main|dev
set -euo pipefail

BRANCH="${1:-}"
if [[ "$BRANCH" != "main" && "$BRANCH" != "dev" ]]; then
  echo "Usage: $0 main|dev" >&2
  exit 1
fi

if [[ "$BRANCH" == "main" ]]; then
  DIR=/var/www/socmed-prod
  ENVFILE=/etc/socmed/prod.env
  NAME=socmed-prod
  PORT=3200
else
  DIR=/var/www/socmed-dev
  ENVFILE=/etc/socmed/dev.env
  NAME=socmed-dev
  PORT=3201
fi

TOKEN="${GH_TOKEN:-$(gh auth token 2>/dev/null || true)}"
if [[ -z "${TOKEN}" ]]; then
  echo "Set GH_TOKEN or run gh auth login" >&2
  exit 1
fi

ssh alloro-asia "set -euo pipefail
source /home/ubuntu/.nvm/nvm.sh
rm -rf ${DIR}.tmp
sudo -u ubuntu git clone --branch ${BRANCH} --single-branch https://x-access-token:${TOKEN}@github.com/LagDave/socmed-test-app.git ${DIR}.tmp
mkdir -p ${DIR}/uploads
rsync -a --delete --exclude '/uploads/' ${DIR}.tmp/ ${DIR}/
rm -rf ${DIR}.tmp
sudo -u ubuntu git -C ${DIR} remote set-url origin https://github.com/LagDave/socmed-test-app.git
chown -R ubuntu:ubuntu ${DIR}
ln -sfn ${ENVFILE} ${DIR}/.env
sudo -u ubuntu bash -lc 'source ~/.nvm/nvm.sh; cd ${DIR} && npm ci && npm --prefix frontend ci && npm run build && npm run migrate'
cat > ${DIR}/ecosystem.config.js <<ECO
module.exports = {
  apps: [{
    name: '${NAME}',
    script: 'dist/index.js',
    cwd: '${DIR}',
    env: { NODE_ENV: 'production', PORT: '${PORT}' },
  }],
};
ECO
chown ubuntu:ubuntu ${DIR}/ecosystem.config.js
sudo -u ubuntu bash -lc 'source ~/.nvm/nvm.sh; pm2 delete ${NAME} 2>/dev/null || true; pm2 start ${DIR}/ecosystem.config.js; pm2 save'
curl -sf http://127.0.0.1:${PORT}/api/health
echo
echo Deployed ${BRANCH} → ${NAME} :${PORT}
"
