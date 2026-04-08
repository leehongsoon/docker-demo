FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (CI runners have internet; node_modules fallback for offline)
RUN npm install --omit=dev || true
COPY node_modules ./node_modules

COPY . .

EXPOSE 80

CMD ["node", "index.js"]
