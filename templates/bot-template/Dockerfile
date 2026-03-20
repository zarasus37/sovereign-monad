FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

CMD ["npm", "start"]
