FROM node:20-alpine

# Non-root user for security
RUN mkdir -p /app /data && chown -R node:node /app /data
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --production && npm cache clean --force

# Copy application code
COPY --chown=node:node . .

# Switch to non-root user
USER node

# Database stored on mounted volume
ENV DB_PATH=/data/layouts.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
