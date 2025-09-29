# syntax=docker/dockerfile:1

# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY webui/package*.json ./webui/

# Install dependencies
RUN npm ci --omit=dev && \
    cd webui && \
    npm ci --omit=dev

# Production stage
FROM node:20-slim

# Install required system dependencies for ONNX Runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/webui/node_modules ./webui/node_modules

# Copy application code
COPY . .

# Create models directory with proper permissions
RUN mkdir -p models && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port for Web UI
EXPOSE 3000

# Default command runs the Web UI server
CMD ["node", "webui/server.js"]