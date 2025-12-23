# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies including devDependencies
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

# Install ts-node globally for dev mode
RUN npm install -g ts-node typescript

# Expose port (optional for Express)
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
