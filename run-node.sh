#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm is not installed at $NVM_DIR" >&2
  exit 1
fi

. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")"
exec npm start
