module.exports = {
    apps: [
        {
            name: "financ-app",
            script: "./server/index.js",
            env_production: {
                NODE_ENV: "production",
                // Adicione outras variáveis de ambiente aqui se necessário, 
                // mas é melhor usar um arquivo .env no servidor
            },
        },
    ],
};
