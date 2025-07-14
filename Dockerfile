# TableTalk AI Backend Dockerfile
# Production-ready Node.js application

# Use official Node.js runtime as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tabletalk -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies in a separate stage for better caching
FROM base AS dependencies

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for building (if needed)
RUN npm ci --only=development

# Production build stage
FROM base AS build

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Remove development dependencies and clean up
RUN npm prune --production && \
    rm -rf /tmp/* /var/cache/apk/*

# Final production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tabletalk -u 1001

# Copy built application from build stage
COPY --from=build --chown=tabletalk:nodejs /app ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create logs directory
RUN mkdir -p /app/logs && chown tabletalk:nodejs /app/logs

# Expose port
EXPOSE 3000

# Switch to non-root user
USER tabletalk

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="TableTalk AI Team <dev@tabletalk.ai>"
LABEL version="1.0.0"
LABEL description="TableTalk AI Backend - Restaurant phone management system"
LABEL org.opencontainers.image.source="https://github.com/tabletalk-ai/backend" 