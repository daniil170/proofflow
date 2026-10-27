#!/usr/bin/env bash
set -e

if [ -z "$JAVA_HOME" ] && [ -d "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [ -n "$FIRESTORE_EMULATOR_HOST" ]; then
  npx vitest run --config vitest.rules.config.ts
else
  firebase emulators:exec --project demo-proofflow-rules-test --only firestore,storage "npx vitest run --config vitest.rules.config.ts"
fi
