#!/bin/bash
echo "=========================================="
echo "  RestoPOS Frontend Starting..."
echo "=========================================="
cd "$(dirname "$0")/frontend"
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo ""
echo "Frontend running at: http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""
npm run dev
