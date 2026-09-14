# Multi-stage build: compile the Vite React app, serve the static build with nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.js index.html ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=http://localhost:18080/api
ARG VITE_LOGIN_PORTAL_URL=http://localhost:3100
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOGIN_PORTAL_URL=$VITE_LOGIN_PORTAL_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN printf 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; add_header Cache-Control "no-cache"; } location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; try_files $uri =404; } }' \
    > /etc/nginx/conf.d/default.conf
EXPOSE 80