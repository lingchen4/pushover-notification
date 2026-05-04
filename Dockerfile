# ── Stage 1: build client ───────────────────────────────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: build server ───────────────────────────────────────────────────
FROM node:20-alpine AS server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ── Stage 3: production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production server dependencies
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

# Copy compiled server
COPY --from=server-build /app/server/dist ./server/dist

# Copy built client next to server so Express can serve it
COPY --from=client-build /app/client/dist ./client/dist

# Persistent data volume mount point
RUN mkdir -p /app/server/data

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server/dist/index.js"]
