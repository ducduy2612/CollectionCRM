#!/bin/bash
# Script to run bank-sync-service repository tests

# Change to the service directory
cd "$(dirname "$0")/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Set NODE_ENV to test
export NODE_ENV=test

# Run only repository tests
echo "Running repository tests..."
npm test -- tests/repositories