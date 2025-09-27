-- Database initialization script for ITV Referral System
-- This script runs when the PostgreSQL container starts

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add any custom initialization here if needed
-- For example, creating custom functions or setting up initial data

-- Log initialization
SELECT 'Database initialization complete for ITV Referral System' as message;