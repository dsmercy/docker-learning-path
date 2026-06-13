FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --silent

COPY server.js ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
