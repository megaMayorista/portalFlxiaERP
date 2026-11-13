FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY cabeceras-seguridad.conf /etc/nginx/snippets/cabeceras-seguridad.conf
COPY proxy-api.conf /etc/nginx/snippets/proxy-api.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
