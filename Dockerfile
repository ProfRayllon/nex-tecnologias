FROM node:22-alpine

ENV NODE_ENV=production \
    APP_ROOT=/app \
    UPLOADS_DIR=/app/uploads \
    PORT=3000
WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Site, área do cliente e painel.
COPY index.html entrar.html portal.html admin.html 404.html ./
COPY assets ./assets
COPY server ./server

# Arquivos enviados pelo painel (volume no docker-compose).
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/saude || exit 1
CMD ["node", "server/src/index.js"]
