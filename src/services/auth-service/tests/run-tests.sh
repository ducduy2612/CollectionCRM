#!/bin/bash

# Test script for Authentication Service
# This script:
# 1. Sets up a test database with test data
# 2. Runs all tests
# 3. Reports test coverage

# Exit on error
set -e

# Display help message
function show_help {
  echo "Authentication Service Test Script"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -u, --unit       Run only unit tests"
  echo "  -i, --integration Run only integration tests"
  echo "  -c, --coverage   Generate coverage report"
  echo "  -v, --verbose    Run tests in verbose mode"
  echo ""
}

# Parse command line arguments
UNIT_ONLY=false
INTEGRATION_ONLY=false
COVERAGE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -u|--unit)
      UNIT_ONLY=true
      shift
      ;;
    -i|--integration)
      INTEGRATION_ONLY=true
      shift
      ;;
    -c|--coverage)
      COVERAGE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $key"
      show_help
      exit 1
      ;;
  esac
done

# Set up environment
echo "Setting up test environment..."
if [ ! -f ".env.test" ]; then
  echo "Creating .env.test from .env.example..."
  cp .env.example .env.test
  echo "" >> .env.test
  echo "# Test-specific overrides" >> .env.test
  echo "NODE_ENV=test" >> .env.test
  echo "JWT_SECRET=test_jwt_secret" >> .env.test
  echo "JWT_EXPIRATION=1h" >> .env.test
  echo "REFRESH_TOKEN_EXPIRATION=7d" >> .env.test
  echo "SESSION_TTL=86400" >> .env.test
else
  echo ".env.test already exists, using existing configuration."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Determine test command
TEST_CMD="npm test"
JEST_ARGS=""

# Add test pattern filter
if [ "$UNIT_ONLY" = true ]; then
  JEST_ARGS="$JEST_ARGS --testPathPattern=unit"
elif [ "$INTEGRATION_ONLY" = true ]; then
  JEST_ARGS="$JEST_ARGS --testPathPattern=integration"
fi

# Add verbose flag if needed
if [ "$VERBOSE" = true ]; then
  JEST_ARGS="$JEST_ARGS --verbose"
fi

# Construct final command
if [ -n "$JEST_ARGS" ]; then
  TEST_CMD="$TEST_CMD -- $JEST_ARGS"
fi

# Use coverage command if requested
if [ "$COVERAGE" = true ]; then
  TEST_CMD="npm run test:coverage"
  JEST_ARGS=""
  
  # Add test pattern filter for coverage
  if [ "$UNIT_ONLY" = true ]; then
    JEST_ARGS="$JEST_ARGS --testPathPattern=unit"
  elif [ "$INTEGRATION_ONLY" = true ]; then
    JEST_ARGS="$JEST_ARGS --testPathPattern=integration"
  fi
  
  # Add verbose flag for coverage if needed
  if [ "$VERBOSE" = true ]; then
    JEST_ARGS="$JEST_ARGS --verbose"
  fi
  
  # Add args to coverage command if any
  if [ -n "$JEST_ARGS" ]; then
    TEST_CMD="$TEST_CMD -- $JEST_ARGS"
  fi
fi

# Run tests
echo "Running tests..."
echo "Command: $TEST_CMD"
eval $TEST_CMD

# Display coverage report if generated
if [ "$COVERAGE" = true ]; then
  echo ""
  echo "Coverage report generated in coverage/ directory"
  echo "Open coverage/lcov-report/index.html in a browser to view detailed report"
fi

echo ""
echo "Tests completed successfully!"