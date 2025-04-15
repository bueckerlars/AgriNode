# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Kopiere Projektdateien
COPY package.json ./
COPY . .

# Installiere Abhängigkeiten und erstelle Build
RUN npm install
RUN npm run build

# Produktions-Stage mit nginx
FROM nginx:alpine

# Kopiere den Build aus dem ersten Stage
COPY --from=build /app/dist /usr/share/nginx/html
# Kopiere die nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port, auf dem nginx läuft
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]