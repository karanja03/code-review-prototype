# Build stage: compile SvelteKit (optional image; primary target is Vercel + Turso)
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Run stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY server.js socket-setup.mjs ./
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server.js"]
