#!/usr/bin/env bash
# =============================================================================
# Generate self-signed SSL certificates for development/testing
# =============================================================================
# Usage: ./ssl/generate-self-signed.sh [DOMAIN]
#
# Arguments:
#   DOMAIN  — the hostname to issue the cert for (default: localhost)
#
# This creates:
#   ssl/server.key   — private key
#   ssl/server.crt   — self-signed certificate (valid 365 days)
# =============================================================================

set -euo pipefail

DOMAIN="${1:-localhost}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Generating self-signed certificate for: ${DOMAIN}"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${SCRIPT_DIR}/server.key" \
  -out "${SCRIPT_DIR}/server.crt" \
  -subj "/C=US/ST=Dev/L=Dev/O=SecondBrain/CN=${DOMAIN}" \
  -addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1"

chmod 600 "${SCRIPT_DIR}/server.key"
chmod 644 "${SCRIPT_DIR}/server.crt"

echo ""
echo "Certificates generated:"
echo "  Key:  ${SCRIPT_DIR}/server.key"
echo "  Cert: ${SCRIPT_DIR}/server.crt"
echo ""
echo "These are self-signed and suitable for development only."
echo "For production, use Let's Encrypt or a trusted CA."
