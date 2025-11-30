# ---- FASE 1: Build do React ----
FROM node:22-alpine AS build

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o código React
COPY . .

# Compila o projeto
RUN npm run build


# ---- FASE 2: Servir com NGINX ----
FROM nginx:1.25-alpine

# Copia os arquivos compilados para o nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expondo porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
