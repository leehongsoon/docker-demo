FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY node_modules ./node_modules

COPY . .

EXPOSE 80

CMD ["node", "index.js"]
