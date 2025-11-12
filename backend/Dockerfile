FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./
# public 用 volume 掛入（在 compose 裡），所以這裡不複製

EXPOSE 3000
CMD ["npm", "start"]
