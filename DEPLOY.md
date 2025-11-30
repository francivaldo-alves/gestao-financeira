
## Deploy com Docker (Recomendado)

Esta é a maneira mais fácil de rodar a aplicação.

1.  **Clone o Repositório**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd financ
    ```

2.  **Configuração de Ambiente (.env)**
    Crie um arquivo `.env` na raiz do projeto.
    ```bash
    nano .env
    ```
    Adicione as variáveis (o `DB_HOST` deve ser `db`):
    ```env
    DB_USER=seu_usuario
    DB_PASSWORD=sua_senha
    DB_NAME=financ_db
    JWT_SECRET=sua_chave_secreta
    ```

3.  **Inicie com Docker Compose**
    ```bash
    docker-compose up -d --build
    ```
    A aplicação estará disponível em `http://localhost:5000`.

---

## Deploy Manual (Sem Docker)

Este guia descreve como colocar a aplicação em produção em um servidor VPS (Ubuntu/Debian recomendado).

## Pré-requisitos

1.  **Node.js & NPM**: Instale a versão LTS do Node.js.
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
2.  **PM2**: Gerenciador de processos para Node.js.
    ```bash
    sudo npm install -g pm2
    ```
3.  **Git**: Para clonar o repositório.

## Passos para Deploy

1.  **Clone o Repositório**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd financ
    ```

2.  **Instale as Dependências**
    ```bash
    # Instalar dependências do servidor
    cd server
    npm install

    # Instalar dependências do cliente
    cd ../client
    npm install
    ```

3.  **Build do Frontend**
    Gere os arquivos estáticos do React.
    ```bash
    cd client
    npm run build
    ```
    Isso criará a pasta `client/dist`.

4.  **Configuração de Ambiente (.env)**
    Crie um arquivo `.env` na pasta `server` com as configurações de produção.
    ```bash
    cd ../server
    nano .env
    ```
    Exemplo:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=seu_usuario
    DB_PASS=sua_senha
    DB_NAME=financ_db
    JWT_SECRET=sua_chave_secreta_super_segura
    NODE_ENV=production
    ```

5.  **Inicie com PM2**
    Volte para a raiz do projeto e inicie a aplicação.
    ```bash
    cd ..
    pm2 start ecosystem.config.js --env production
    ```

6.  **Salvar Processos**
    Para que o PM2 inicie automaticamente após reiniciar o servidor:
    ```bash
    pm2 save
    pm2 startup
    ```

## Atualizando a Aplicação

Para atualizar uma nova versão:

1.  `git pull`
2.  `cd client && npm install && npm run build`
3.  `cd ../server && npm install`
4.  `pm2 restart financ-app`
