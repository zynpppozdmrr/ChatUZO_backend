#!/bin/sh

echo "🚀 Starting deployment process..."

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Generate Prisma Client (in case it's needed)
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Start the server
echo "🎯 Starting server..."
node dist/index.js
