#!/bin/sh
set -eu
echo "Running migrations..."
npx tsx ./node_modules/knex/bin/cli.js --knexfile knexfile.ts migrate:latest
echo "Starting API on :${PORT:-3210}"
exec node dist/index.js
