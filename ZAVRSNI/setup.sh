#!/bin/bash

echo "===================================="
echo "Digital Twin Dakovo - Setup"
echo "===================================="
echo ""

echo "[1/3] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend installation failed!"
    exit 1
fi
echo "Backend dependencies installed successfully!"
echo ""

echo "[2/3] Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend installation failed!"
    exit 1
fi
echo "Frontend dependencies installed successfully!"
echo ""

echo "[3/3] Setup complete!"
echo ""
echo "===================================="
echo "Next steps:"
echo "1. Create .env files if needed (see MAPBOX_SETUP.md)"
echo "2. Run './start.sh' to launch the application"
echo "===================================="
echo ""

cd ..
