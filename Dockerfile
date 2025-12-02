# =====================================================
# 🚀 STAGE 1 — Build do Frontend (Vite + React)
# =====================================================
FROM node:22-alpine AS client-build

WORKDIR /app

# Copiar dependências do frontend
COPY client/package*.json ./client/

WORKDIR /app/client
RUN npm install

# Copiar código do frontend
COPY client/ ./ 

# Gerar build de produção
RUN npm run build



# =====================================================
# 🚀 STAGE 2 — Backend + Frontend Build Copiado
# =====================================================
FROM node:22-alpine

WORKDIR /app

# Copiar arquivos do backend
COPY server/package*.json ./server/

WORKDIR /app/server
RUN npm install

# Copiar restante do backend
COPY server/ ./ 

# Copiar build do frontend para dentro do backend (ex: /public)
COPY --from=client-build /app/client/dist ./public

# Expor porta
EXPOSE 5000

# Comando de execução
CMD ["npm", "start"]
