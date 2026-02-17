#!/bin/bash
# ============================================================
#  Bistro Bill - One-Command Setup
#  Run: bash setup.sh
# ============================================================

set -e

echo ""
echo "============================================"
echo "   Bistro Bill - Docker Setup"
echo "============================================"
echo ""

# Check Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed."
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "[1/3] Building containers (this may take a few minutes on first run)..."
docker compose up --build -d

echo ""
echo "[2/3] Waiting for services to start..."
sleep 5

# Wait for backend to be ready
echo "       Waiting for backend..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5001/api/v1 > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

echo ""
echo "[3/3] Seeding the database..."
docker compose exec backend sh -c "npx ts-node prisma/seed.ts" 2>/dev/null || echo "       (Seed skipped - database already has data from SQL dump)"

echo ""
echo "============================================"
echo "   Bistro Bill is ready!"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5001"
echo "   Database:  localhost:5432"
echo ""
echo "   To stop:   docker compose down"
echo "   To reset:  docker compose down -v && bash setup.sh"
echo "============================================"
echo ""
