FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy project source files
COPY . .

# Expose server port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server/index.js"]

