#!/bin/bash
echo "=========================================="
echo "  RestoPOS Backend Starting..."
echo "=========================================="
cd "$(dirname "$0")/backend"
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo ""
echo "Backend running at: http://localhost:3001"
echo "Press Ctrl+C to stop"
echo ""
node server.js
