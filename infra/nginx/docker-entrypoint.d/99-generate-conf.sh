#!/bin/sh
set -eu

if [ -z "${DOMAIN:-}" ]; then
  echo "ERROR: DOMAIN is not set (required for reverse-proxy config)."
  exit 1
fi

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
HAS_CERT="false"
if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  HAS_CERT="true"
fi

if [ "${HAS_CERT}" = "true" ]; then
  echo "reverse-proxy: using HTTPS config for ${DOMAIN}"
  envsubst '$DOMAIN' < /etc/nginx/templates/app-https.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "reverse-proxy: cert not found yet; using HTTP-only bootstrap config for ${DOMAIN}"
  envsubst '$DOMAIN' < /etc/nginx/templates/app-http.conf.template > /etc/nginx/conf.d/default.conf
fi



