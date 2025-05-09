#!/bin/bash

# Install dependencies
npm install

# Install common module
npm install --save ../../../src/common

# Build the common module
cd ../../../src/common
npm install
npm run build

# Return to auth-service directory
cd ../../../src/services/auth-service

echo "Dependencies installed successfully!"