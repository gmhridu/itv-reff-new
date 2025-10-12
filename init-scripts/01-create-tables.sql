-- 01-create-tables.sql
-- Create core tables if needed before Prisma migrations

-- This is typically not needed as Prisma handles schema creation
-- But can be useful for custom extensions or pre-initialization

-- Example of creating a simple audit table
CREATE TABLE IF NOT EXISTS startup_logs (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO startup_logs (message) VALUES ('Database initialization script executed');