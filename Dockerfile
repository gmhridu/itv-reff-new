# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only (skip postinstall scripts like prisma generate)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Install dev dependencies for build
FROM base AS dev-deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci && npm cache clean --force


# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from dev-deps
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy rest of the app
COPY . .

# Generate Prisma Client and build Next.js application
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static 
COPY --from=builder --chown=nextjs:nodejs /app/public ./public 
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma 
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json 

# Copy production node_modules (without re-running postinstall)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Ensure correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
