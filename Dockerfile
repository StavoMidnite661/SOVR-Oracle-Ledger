# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Install global dependencies for runtime (if needed, e.g. tsx for non-transpiled run)
RUN npm install -g tsx

# Install curl for gateway proxy (Alpine Linux)
RUN apk add --no-cache curl

# Expose ports for all services (for documentation/local use, mapped via compose)
EXPOSE 3001 3002 3003 3004 3005

# Default command (can be overridden)
CMD ["npm", "run", "start-microservices"]
