# Use Node.js 22
FROM node:22-bookworm

WORKDIR /app

COPY package*.json tsconfig.json jest.config.js ./
RUN npm ci

COPY src/ ./src/
COPY tests/ ./tests/
RUN npm run build

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["node", "dist/index.js"]
