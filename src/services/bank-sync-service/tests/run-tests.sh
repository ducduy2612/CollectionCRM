#!/bin/bash
# Script to run bank-sync-service tests

# Change to the service directory
cd "$(dirname "$0")/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Set NODE_ENV to test
export NODE_ENV=test

# Run tests with the specified arguments or all tests if no arguments
if [ $# -eq 0 ]; then
  echo "Running all tests..."
  npm test
else
  echo "Running specified tests..."
  npm test -- "$@"
fi