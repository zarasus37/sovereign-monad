FROM node:22-bookworm

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
COPY config/ ./config/
COPY .env.example ./.env.example
RUN npm run build

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3010/health').then(r=>{if(!r.ok) process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "start"]
