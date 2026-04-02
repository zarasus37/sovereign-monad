# Use Node.js 22
FROM node:22-bookworm

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create user and set permissions
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["node", "dist/index.js"]
