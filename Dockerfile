# Stage 1: Build the frontend
FROM node:22 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . ./
RUN npm run build

# Install server dependencies
WORKDIR /app/server
COPY server/package.json ./
RUN npm ci --omit=dev

# Stage 2: Production server image
FROM node:22-slim

WORKDIR /app

# Run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy server files
COPY --from=builder /app/server .
# Copy built frontend assets
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
