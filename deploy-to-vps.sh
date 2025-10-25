#!/bin/bash

# Deploy Conference App to VPS
echo "=== Deploying Conference App to VPS ==="

# VPS details
VPS_HOST="138.124.14.203"
VPS_USER="root"
VPS_PASS="RNixIsjtRgJ0"
APP_DIR="/root/conference"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y sshpass
    else
        echo "Please install sshpass manually"
        exit 1
    fi
fi

# Stop existing application
echo "Stopping existing application..."
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $APP_DIR && pm2 stop conference-app || echo 'No existing app'"

# Copy application files
echo "Copying application files..."
sshpass -p $VPS_PASS scp -r -o StrictHostKeyChecking=no . $VPS_USER@$VPS_HOST:$APP_DIR/

# Setup and start application on VPS
echo "Setting up application on VPS..."
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
cd $APP_DIR

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npm run db:migrate || echo "Migrations failed, continuing..."

echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Checking application status..."
pm2 status

echo "Application logs:"
pm2 logs conference-app --lines 10

EOF

echo "=== Deployment Complete ==="
echo "Your application is now running on: http://$VPS_HOST:3000"
echo ""
echo "To check status: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 status'"
echo "To view logs: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 logs conference-app'"
echo "To restart: ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 restart conference-app'"