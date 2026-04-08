# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY index.js ./
COPY index.html ./
COPY style.css ./
COPY app.js ./

# ── Runtime ────────────────────────────────────────────────────────────────────
EXPOSE 80

CMD ["node", "index.js"]
