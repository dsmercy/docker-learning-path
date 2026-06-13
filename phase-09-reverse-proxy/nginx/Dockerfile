FROM nginx:stable-alpine

# Generate a self-signed TLS certificate at build time.
# For production use a cert from Let's Encrypt or your CA instead.
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/certs \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -keyout /etc/nginx/certs/server.key \
       -out    /etc/nginx/certs/server.crt \
       -subj   "/CN=localhost/O=DockerLearning/C=US"

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
