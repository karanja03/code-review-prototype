# Optional local/container run. Production on Vercel uses @sveltejs/adapter-vercel (not this image).
# Uses `vite preview` — the custom `server.js` Socket.IO server is not started here.
FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
