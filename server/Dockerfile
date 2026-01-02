# Multi-stage build for production optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all necessary files for build
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY src ./src
COPY start.sh ./start.sh

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma Client in production stage
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/start.sh ./start.sh

# Make start script executable
RUN chmod +x ./start.sh

# Expose port (Railway will override with PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run start script
CMD ["./start.sh"]
