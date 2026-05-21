FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY config.example.json ./
COPY apps ./apps

EXPOSE 8787

CMD ["node", "apps/server/src/server.js"]
