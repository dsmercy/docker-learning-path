FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --silent

COPY server.js ./

# /data is the mount point for the named volume.
# Create it here so it exists even if no volume is mounted (e.g. local testing).
RUN mkdir -p /data && chown -R appuser:appgroup /app /data

ENV DATA_DIR=/data

USER appuser

EXPOSE 3001

CMD ["node", "server.js"]
