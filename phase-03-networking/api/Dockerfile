# Single-stage — Node runtime only, no build step needed for plain JS
FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --silent

COPY server.js ./

# Give appuser ownership before switching
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["node", "server.js"]
