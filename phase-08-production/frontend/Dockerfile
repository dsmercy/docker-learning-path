# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — build
# Full Node.js SDK: install ALL dependencies (including devDeps) and compile
# the Vite/React app into static HTML/JS/CSS in /app/dist.
# This stage is large (~300 MB) and is discarded entirely in production.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS build

# VITE_API_URL is baked into the JS bundle at build time by Vite.
# It must be the host-visible address (e.g. http://localhost:3001),
# NOT a Docker internal service name, because the browser calls it.
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

COPY package.json ./
RUN npm install --silent

COPY . .

# Vite outputs the production bundle to /app/dist.
RUN npm run build

# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — serve
# Nginx serves the pre-built static files.
# The final image contains ONLY nginx + the /dist output — no Node, no npm,
# no source code.  This is what makes it < 30 MB.
# ══════════════════════════════════════════════════════════════════════════════
FROM nginx:stable-alpine AS production

# Non-root user for the Nginx process.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Custom Nginx config (SPA routing: all paths fall back to index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled dist from the build stage — nothing else.
COPY --from=build /app/dist /usr/share/nginx/html

# Give the non-root user ownership of every path Nginx writes to at runtime.
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
