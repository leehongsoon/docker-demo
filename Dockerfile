FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Try npm install (works on CI/Render with internet); fall back to pre-installed node_modules
RUN npm install --omit=dev 2>/dev/null; true

# Copy pre-installed node_modules as offline fallback
COPY node_modules ./node_modules

COPY . .

EXPOSE 80

CMD ["node", "index.js"]
