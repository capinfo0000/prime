#!/usr/bin/env bash
# Usage: ANNICT_TOKEN=xxxx bash spikes/run-annict.sh
# または .env に ANNICT_TOKEN=xxxx を書いて実行
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${ANNICT_TOKEN:?ANNICT_TOKEN が未設定です（.env か環境変数で指定）}"

curl -sS -X POST https://api.annict.com/graphql \
  -H "Authorization: Bearer ${ANNICT_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @spikes/annict-query.json \
  -o spikes/annict-response.json \
  -w "HTTP %{http_code}, %{size_download} bytes\n"

node spikes/analyze-annict.mjs
