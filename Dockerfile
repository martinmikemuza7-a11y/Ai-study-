# Production Dockerfile for Google Cloud Run
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Build Vite client assets and production server bundle (dist/server.cjs)
RUN npm run build

# Cloud Run production environment
ENV NODE_ENV=production
ENV PORT=3000

# Container port (must match Cloud Run container port 3000)
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
