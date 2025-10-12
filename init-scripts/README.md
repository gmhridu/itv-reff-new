# Database Initialization Scripts

This directory contains scripts that are automatically executed when the PostgreSQL container starts for the first time. These scripts are mounted to the `/docker-entrypoint-initdb.d` directory in the PostgreSQL container.

## Files

1. `init-db.sql` - Main database initialization script
2. `01-create-tables.sql` - Sample table creation script
3. `02-app-setup.sh` - Post-initialization shell script

## How it works

When the PostgreSQL Docker container starts for the first time, it will automatically execute:

1. All `.sql` files in alphabetical order
2. All `.sh` files in alphabetical order

## Customization

To customize the initialization:

1. Modify `init-db.sql` to create your database and set up extensions
2. Add additional `.sql` files for table creation
3. Add `.sh` scripts for more complex setup tasks

## Important Notes

- These scripts only run on the first container startup
- For subsequent runs, you'll need to use Prisma migrations
- Make sure scripts are idempotent (can be run multiple times without issues)