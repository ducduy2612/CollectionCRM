const path = require('path');
const Module = require('module');

// Define path mappings
const pathMappings = {
  '@': path.resolve(__dirname, 'dist'),
  '@/types': path.resolve(__dirname, 'dist/types'),
  '@/models': path.resolve(__dirname, 'dist/models'),
  '@/services': path.resolve(__dirname, 'dist/services'),
  '@/processors': path.resolve(__dirname, 'dist/processors'),
  '@/utils': path.resolve(__dirname, 'dist/utils')
};

// Override the resolve filename function
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // Check if request starts with any of our path mappings
  for (const [alias, actualPath] of Object.entries(pathMappings)) {
    if (request.startsWith(alias + '/')) {
      // Replace the alias with the actual path
      const relativePath = request.substring(alias.length + 1);
      const resolvedPath = path.resolve(actualPath, relativePath);
      request = resolvedPath;
      break;
    } else if (request === alias) {
      // Handle exact alias match
      request = actualPath;
      break;
    }
  }
  
  return originalResolveFilename.call(this, request, parent, isMain, options);
};