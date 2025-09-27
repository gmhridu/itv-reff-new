# Docker Compose Setup Guide

This document explains how to use the Docker Compose configurations for the ITV Referral System.

## Available Configurations

### 1. Development Setup (`docker-compose.dev.yml`)
- Uses SQLite database (file-based)
- Binds local directory for development
- Suitable for local development and testing

### 2. Production Setup (`docker-compose.prod.yml`)
- Uses PostgreSQL database in a separate container
- More secure with environment variables
- Suitable for production deployment

### 3. Simple Setup (`docker-compose.yml`)
- Uses PostgreSQL database
- Hardcoded credentials (not recommended for production)
- Simple setup for quick testing

## Usage Instructions

### Development Setup

1. **Start the services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Setup

1. **Update environment variables:**
   Edit the `.env.production` file with your actual values:
   ```env
   POSTGRES_PASSWORD=your_secure_password_here
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
   REFRESH_SECRET=your_super_secret_refresh_key_here_minimum_32_characters
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   BACKEND_URL=https://yourdomain.com
   ```

2. **Start the services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production down
   ```

### Simple Setup (Testing Only)

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

## Database Migrations

When using the PostgreSQL setup, you may need to run database migrations:

1. **Run migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production exec app npm run db:migrate
   ```

2. **Generate Prisma client:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production exec app npm run db:generate
   ```

## Testing the Setup

You can test if the Docker Compose setup is working correctly:

```bash
npm run test:docker
```

This will verify:
- Database connection
- Basic queries
- Essential table existence

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   If ports 3000 or 5432 are already in use, modify the port mappings in the docker-compose files.

2. **Permission issues:**
   On some systems, you might need to run Docker commands with `sudo`.

3. **Volume permissions:**
   If you encounter permission issues with volumes, ensure Docker has access to the project directory.

### Checking Service Status

```bash
# List running containers
docker-compose ps

# Check specific service logs
docker-compose logs app
docker-compose logs db
```

## Security Considerations

1. **Never use default passwords** in production
2. **Use environment files** for sensitive data
3. **Regularly update** base images
4. **Limit exposed ports** to only what's necessary
5. **Use networks** to isolate services

## Customization

You can customize the setup by modifying:
- Port mappings in the docker-compose files
- Environment variables in the .env files
- Volume mappings for persistent data
- Network configurations