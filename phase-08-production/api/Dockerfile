# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — deps
# Install only production dependencies.
# Separating this stage means Docker can cache the npm install layer
# independently of source code changes.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first so the npm install layer is cached until they change.
COPY package.json ./
RUN npm install --omit=dev --silent

# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — production runtime
# Start from the same slim base; copy only what production needs.
# The Node.js SDK, npm cache, and devDependencies are left behind in stage 1.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

# Create a non-root user before adding any files.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Pull in only the installed production node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY server.js ./

# Hand ownership of the entire workdir to the non-root user.
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

# Health check: wget is included in alpine; curl is not.
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
