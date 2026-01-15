#!/bin/bash

#
# Simple deployment script (Docker Compose v2)
# - Optional git pull
# - Build selected services (or all)
# - Up -d with remove-orphans
# - Force-recreate reverse-proxy to avoid stale upstream IPs (common cause of 502 after rebuild)
#
# Usage:
#   ./deploy.sh                     # pull + build all + up
#   ./deploy.sh --no-pull           # skip git pull
#   ./deploy.sh backend frontend    # pull + build only these services + up
#

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

COMPOSE="docker compose"

NO_PULL="false"
SERVICES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pull)
      NO_PULL="true"
      shift
      ;;
    -h|--help)
      echo "Usage: ./deploy.sh [--no-pull] [service1 service2 ...]"
      exit 0
      ;;
    *)
      SERVICES+=("$1")
      shift
      ;;
  esac
done

echo "== LaTeX Code Generator deploy =="
echo "cwd: $PROJECT_DIR"

if [[ "$NO_PULL" != "true" ]]; then
  echo ""
  echo "-> git pull"
  git pull || true
fi

echo ""
if [[ ! -f ".env" ]]; then
  echo "WARN: .env not found in repo root; compose will use environment defaults."
else
  echo "OK: .env found"
fi

echo ""
if [[ ${#SERVICES[@]} -eq 0 ]]; then
  echo "-> build (all services)"
  $COMPOSE build
else
  echo "-> build (selected services): ${SERVICES[*]}"
  $COMPOSE build "${SERVICES[@]}"
fi

echo ""
echo "-> up -d"
$COMPOSE up -d --remove-orphans

echo ""
echo "-> force-recreate reverse-proxy (prevents 502 after container IP changes)"
$COMPOSE up -d --force-recreate reverse-proxy

echo ""
echo "-> status"
$COMPOSE ps

echo ""
echo "Done."
