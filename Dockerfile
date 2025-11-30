# Estágio 1: Build do Frontend
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Estágio 2: Setup do Backend e Runtime
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production
COPY server/ ./

# Copia o build do frontend para o backend servir
COPY --from=client-build /app/client/dist ../client/dist

# Variáveis de ambiente padrão (podem ser sobrescritas)
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "index.js"]
