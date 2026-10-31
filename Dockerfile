# git-client-agents: the dashboard, built once and served by nginx.
# Build: docker build -t git-client-agents .
# Run:   docker run -p 8080:8080 -e API_URL=https://your-server.example git-client-agents
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Optional build-time default; API_URL at run time takes precedence.
ARG VITE_API_URL=
RUN npm run build

FROM nginx:alpine
ENV PORT=8080
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/40-app-config.sh /docker-entrypoint.d/40-app-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
