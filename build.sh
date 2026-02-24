#!/usr/bin/env bash
# =============================================================================
# Rider App Build & Deploy Script
# =============================================================================
set -euo pipefail

APP_NAME="rider-app"
NAMESPACE="logistics"
REGISTRY_REPO="docker.io/codevertex/rider-app"
DEVOPS_DIR="${DEVOPS_DIR:-$HOME/devops-k8s}"
DEVOPS_REPO="${DEVOPS_REPO:-Bengo-Hub/devops-k8s}"

if [[ -z ${GITHUB_SHA:-} ]]; then
  GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD || echo "local")
else
  GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

# Build-time env vars (baked into the Next.js bundle)
NEXT_PUBLIC_LOGISTICS_API_URL="${NEXT_PUBLIC_LOGISTICS_API_URL:-https://logisticsapi.codevertexitsolutions.com}"
NEXT_PUBLIC_SSO_URL="${NEXT_PUBLIC_SSO_URL:-https://sso.codevertexitsolutions.com}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://rider.codevertexitsolutions.com}"
NEXT_PUBLIC_TENANT_SLUG="${NEXT_PUBLIC_TENANT_SLUG:-urban-loft}"

echo "[INFO] Building ${APP_NAME}:${GIT_COMMIT_ID}"

DOCKER_BUILDKIT=1 docker build . \
  -t "${REGISTRY_REPO}:${GIT_COMMIT_ID}" \
  --build-arg NEXT_PUBLIC_LOGISTICS_API_URL="$NEXT_PUBLIC_LOGISTICS_API_URL" \
  --build-arg NEXT_PUBLIC_TENANT_SLUG="$NEXT_PUBLIC_TENANT_SLUG"

# Push to registry
if [[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
  echo "$REGISTRY_PASSWORD" | docker login docker.io -u "$REGISTRY_USERNAME" --password-stdin
  docker push "${REGISTRY_REPO}:${GIT_COMMIT_ID}"
  echo "[SUCCESS] Image pushed: ${REGISTRY_REPO}:${GIT_COMMIT_ID}"
fi

# Update Helm values in devops-k8s
if [[ ! -d "$DEVOPS_DIR" ]]; then
  TOKEN="${GH_PAT:-${GITHUB_TOKEN:-}}"
  CLONE_URL="https://github.com/${DEVOPS_REPO}.git"
  [[ -n "${TOKEN:-}" ]] && CLONE_URL="https://x-access-token:${TOKEN}@github.com/${DEVOPS_REPO}.git"
  git clone "$CLONE_URL" "$DEVOPS_DIR" || echo "[WARN] Could not clone devops-k8s"
fi

if [[ -f "${DEVOPS_DIR}/scripts/helm/update-values.sh" ]]; then
  source "${DEVOPS_DIR}/scripts/helm/update-values.sh"
  if declare -f update_helm_values >/dev/null 2>&1; then
    update_helm_values "$APP_NAME" "$GIT_COMMIT_ID" "$REGISTRY_REPO"
  fi
fi

echo "[INFO] Done! Image: ${REGISTRY_REPO}:${GIT_COMMIT_ID}"
