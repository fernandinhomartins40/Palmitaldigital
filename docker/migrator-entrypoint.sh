#!/bin/sh
set -eu

has_migrations() {
  [ -d /app/apps/api/prisma/migrations ] && \
    find /app/apps/api/prisma/migrations -mindepth 2 -maxdepth 2 -name migration.sql | grep -q .
}

if has_migrations; then
  echo "Applying Prisma migrations..."
  pnpm --filter api exec prisma migrate deploy
else
  echo "No Prisma migrations found. Syncing schema with db push..."
  pnpm --filter api exec prisma db push --skip-generate
fi

echo "Running Prisma seed..."
pnpm --filter api exec prisma db seed
