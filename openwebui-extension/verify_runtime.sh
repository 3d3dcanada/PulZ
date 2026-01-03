#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OPENWEBUI_BASE_URL:-http://localhost:8080}"
AUTH_HEADER=()

if [[ -n "${OPENWEBUI_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${OPENWEBUI_TOKEN}")
fi

echo "PulZ OpenWebUI runtime verification"
echo "Base URL: ${BASE_URL}"

echo "1) Unauthenticated request to /pulz/ should be blocked (401/403)."
status="$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/pulz/")"
echo "   -> HTTP ${status}"
if [[ "${status}" != "401" && "${status}" != "403" ]]; then
  echo "Expected 401/403 for unauthenticated access."
  exit 1
fi

if [[ -z "${OPENWEBUI_TOKEN:-}" ]]; then
  echo "OPENWEBUI_TOKEN not set. Skipping authenticated checks."
  exit 0
fi

echo "2) Authenticated request to /pulz/ should return HTML."
curl -fsSL "${AUTH_HEADER[@]}" "${BASE_URL}/pulz/" >/tmp/pulz_index.html
grep -q "PulZ" /tmp/pulz_index.html
echo "   -> HTML contains PulZ"

echo "3) Authenticated route checks (expect 200)."
for route in /pulz/ /pulz/opportunities /pulz/drafts /pulz/jobs /pulz/revenue /pulz/activity; do
  code="$(curl -s -o /dev/null -w "%{http_code}" "${AUTH_HEADER[@]}" "${BASE_URL}${route}")"
  echo "   ${route} -> ${code}"
  if [[ "${code}" != "200" ]]; then
    echo "Expected 200 for ${route}"
    exit 1
  fi
done

echo "4) Static asset sanity check (expect 200)."
asset_path="$(grep -oE "/pulz/_next/[^\"']+" /tmp/pulz_index.html | head -n 1)"
if [[ -z "${asset_path}" ]]; then
  echo "No /pulz/_next assets found in HTML. Ensure NEXT_PUBLIC_BASE_PATH=/pulz during build."
  exit 1
fi
code="$(curl -s -o /dev/null -w "%{http_code}" "${AUTH_HEADER[@]}" "${BASE_URL}${asset_path}")"
echo "   ${asset_path} -> ${code}"
if [[ "${code}" != "200" ]]; then
  echo "Expected 200 for asset ${asset_path}"
  exit 1
fi

echo "Runtime verification complete."
