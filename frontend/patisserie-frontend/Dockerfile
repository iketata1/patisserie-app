# ---- build Angular ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Angular.json sort vers dist/patisserie-frontend
RUN npm run build -- --configuration production

# ---- runtime avec Nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copie le sous-dossier qui contient index.html
COPY --from=build /app/dist/patisserie-frontend/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]