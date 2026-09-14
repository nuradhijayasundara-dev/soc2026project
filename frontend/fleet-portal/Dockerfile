# Multi-stage build: compile the Vite React app, serve the static build with nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.js index.html ./
RUN npm install
COPY . .
# VITE_* vars are baked into the bundle at BUILD time — docker-compose passes
# them as build args, see docker-compose.yml.
ARG VITE_API_BASE_URL=http://localhost:18080/api
ARG VITE_OSRM_BASE_URL=http://localhost:5000
ARG VITE_LOGIN_PORTAL_URL=http://localhost:3100
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OSRM_BASE_URL=$VITE_OSRM_BASE_URL
ENV VITE_LOGIN_PORTAL_URL=$VITE_LOGIN_PORTAL_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# React Router needs unmatched paths to fall back to index.html.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n    add_header Cache-Control "no-cache";\n  }\n  location /assets/ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    try_files $uri =404;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80