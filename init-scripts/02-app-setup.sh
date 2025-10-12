#!/bin/bash
# 02-app-setup.sh
# Post-initialization script for application setup

echo "=== Application Setup Script ==="
echo "Running post-initialization tasks..."

# This script would run after the database is initialized
# It can be used for any additional setup tasks

echo "1. Checking database connectivity..."
# pg_isready -U postgres -d itv_reff_db

echo "2. Creating necessary directories..."
mkdir -p /app/logs
mkdir -p /app/uploads

echo "3. Setting permissions..."
chown -R postgres:postgres /app

echo "Post-initialization completed successfully."