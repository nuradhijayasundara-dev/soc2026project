# Multi-stage build: compile the Vite React app, serve the static build with nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.js index.html ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=http://localhost:18080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n    add_header Cache-Control "no-cache";\n  }\n  location /assets/ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    try_files $uri =404;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80