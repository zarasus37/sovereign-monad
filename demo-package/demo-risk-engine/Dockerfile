FROM node:22-bookworm

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

CMD ["npm", "start"]
