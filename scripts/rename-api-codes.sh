#!/usr/bin/env bash
set -euo pipefail

# Helper: run sed replacement only on .js files, skipping node_modules
replace () {
  local FROM="$1"
  local TO="$2"
  echo "🔄  $FROM  →  $TO"
  find . -type f -name "*.js" ! -path "./node_modules/*" -exec \
    sed -i "s/\b$FROM\b/$TO/g" {} +
}

# --- MAPPING TABLE -----------------------------------------------------------
replace INVALID_CREDENTIALS         AUTH_INVALID_CREDENTIALS
replace EMAIL_ALREADY_EXISTS        AUTH_USER_ALREADY_EXISTS
replace USERNAME_ALREADY_EXISTS     AUTH_USER_ALREADY_EXISTS
replace USER_ALREADY_VERIFIED       AUTH_USER_ALREADY_VERIFIED
replace INVALID_TOKEN               AUTH_TOKEN_INVALID
replace INVALID_VERIFICATION_TOKEN  AUTH_TOKEN_INVALID
replace TOKEN_EXPIRED               AUTH_TOKEN_EXPIRED
replace TOKEN_ALREADY_USED          AUTH_TOKEN_ALREADY_USED
replace TOKEN_REVOKED               AUTH_TOKEN_REVOKED
replace TOKEN_MALICIOUS             AUTH_TOKEN_MALICIOUS
replace TOKEN_OTHER_FLOW            AUTH_TOKEN_OTHER_FLOW
replace FORBIDDEN                   AUTH_FORBIDDEN
replace RATE_LIMIT_EXCEEDED         AUTH_RATE_LIMIT
replace USER_NOT_FOUND              AUTH_USER_NOT_FOUND
# ---------------------------------------------------------------------------

echo "✅  Replacements complete. Now run: npm run lint && npm test"
