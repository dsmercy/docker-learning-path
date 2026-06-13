FROM node:20-alpine AS build
ARG VITE_API_URL=http://localhost:3001
ARG VITE_BUILD_SHA=local
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BUILD_SHA=${VITE_BUILD_SHA}
WORKDIR /app
COPY package.json ./
RUN npm install --silent
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid
USER appuser
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
