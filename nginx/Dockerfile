FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost/nginx-health || exit 1

EXPOSE 80
