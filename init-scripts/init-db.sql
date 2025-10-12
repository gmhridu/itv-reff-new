-- init-db.sql
-- Database initialization script for PostgreSQL
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create the database (if it doesn't exist)
CREATE DATABASE itv_reff_db WITH OWNER = postgres;

-- Connect to the database
\c itv_reff_db;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas if needed
-- (Prisma will handle most schema creation through migrations)

-- Set up initial database permissions
GRANT ALL PRIVILEGES ON DATABASE itv_reff_db TO postgres;

-- Create a dedicated user for the application if needed
-- CREATE USER app_user WITH PASSWORD 'strong_password';
-- GRANT ALL PRIVILEGES ON DATABASE itv_reff_db TO app_user;

-- Note: Table structures will be created by Prisma migrations during application startup