# ── Stage 1: build ────────────────────────────────────────────────────────────
# Use the full Node image only for building — it is never shipped to production.
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first so this layer is cached until they change.
COPY package.json package-lock.json* ./

RUN npm ci --silent

# Copy the rest of the source and produce the static build output in /app/dist.
COPY . .

RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
# The final image contains only Nginx + the compiled static files.
# No Node, no npm, no source code — dramatically smaller than the build stage.
FROM nginx:stable-alpine AS serve

# Create a non-root user and group for Nginx to run as.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Replace the default Nginx config with our SPA-aware config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx needs to write to these paths; grant ownership to appuser.
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
