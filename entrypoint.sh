#!/bin/sh
set -e
echo "Running database migrations..."
node -e "import('./drizzle/migrate.js').then(m => m.default())"
echo "Starting application..."
exec node dist/index.js
