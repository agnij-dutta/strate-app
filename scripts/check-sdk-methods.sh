#!/usr/bin/env bash
# Verify every `method: "<name>"` the SDK calls actually exists as a
# `pub fn <name>` on the corresponding protocol contract.
#
# Catches the class of bug where the SDK drifts behind a contract
# rename (e.g. mint_pt_yt -> mint after the H-01 push-topology
# refactor) before any user hits "Sign & Broadcast" with a method
# the chain will reject as MissingValue.
#
# Run before every release. Wired into `npm run prerelease` and a
# GitHub Actions job in .github/workflows/sdk-drift.yml.
#
# Usage:
#   ./scripts/check-sdk-methods.sh                # uses ../strate-protocol
#   PROTOCOL_DIR=/tmp/strate-protocol ./scripts/check-sdk-methods.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PROTOCOL="${PROTOCOL_DIR:-../strate-protocol}"
if [[ ! -d "$PROTOCOL/contracts" ]]; then
  echo "protocol repo not found at $PROTOCOL (set PROTOCOL_DIR)" >&2
  exit 2
fi

SDK="vendor/strate-sdk/src"
if [[ ! -d "$SDK" ]]; then
  # If the vendored source isn't there, fall back to a sibling sdk repo.
  SDK="../strate-sdk/src"
fi
if [[ ! -d "$SDK" ]]; then
  echo "SDK source not found at vendor/strate-sdk/src or ../strate-sdk/src" >&2
  exit 2
fi

# 1. Extract every `pub fn <name>(` from the protocol contracts. We match
#    the signature start only, because Soroban contract fns often wrap
#    their args onto multiple lines and a stricter regex would miss them.
#    Filter out __constructor (called by the deploy machinery, not
#    from a tx) and the storage helpers (read_/write_/etc) that are
#    pub-by-crate but never invoked cross-contract.
PUB_FNS=$(
  grep -rhE '^\s*pub fn [a-z_][a-z0-9_]*\s*\(' "$PROTOCOL/contracts" \
    | sed -E 's/.*pub fn ([a-z_][a-z0-9_]*).*/\1/' \
    | grep -vE '^(__constructor|read_|write_|mark_initialized|is_initialized|bump_persistent)$' \
    | sort -u
)

# 2. Extract every `method: "..."` string the SDK's transaction builders
#    emit. These are the call sites the chain will see.
SDK_METHODS=$(
  grep -rhoE 'method: "[a-z_][a-z0-9_]*"' "$SDK/transactions" \
    | sed -E 's/method: "([^"]+)"/\1/' \
    | sort -u
)

# 3. Diff. Any SDK method not in the protocol's pub-fn set is a bug.
missing=""
for m in $SDK_METHODS; do
  if ! grep -qx "$m" <<< "$PUB_FNS"; then
    missing="$missing $m"
  fi
done

if [[ -n "$missing" ]]; then
  echo "ERROR: SDK calls methods that don't exist on any protocol contract:" >&2
  for m in $missing; do
    echo "  - $m" >&2
    # Show the SDK file(s) that emit the offender so the fix is one click away.
    grep -rln "method: \"$m\"" "$SDK/transactions" | sed 's/^/      at /' >&2
  done
  echo "" >&2
  echo "Available protocol pub fns (for reference):" >&2
  echo "$PUB_FNS" | sed 's/^/  /' >&2
  exit 1
fi

echo "✓ SDK methods all match protocol surface ($(wc -l <<< "$SDK_METHODS" | tr -d ' ') checked)"
