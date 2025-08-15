FROM node:22-alpine AS frontend-builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY client/package*.json ./client/
COPY shared/ ./shared/

RUN npm install

COPY client/ ./client/

WORKDIR /usr/src/app/client
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/ ./shared/

RUN npm install

COPY server/ ./server/

WORKDIR /usr/src/app/server
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/app

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S viulumeri -u 1001

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm ci --only=production --workspace=server && \
    npm cache clean --force

COPY --from=backend-builder /usr/src/app/server/dist ./server/dist

COPY --from=frontend-builder /usr/src/app/client/dist ./client/dist

COPY shared/ ./shared/

RUN chown -R viulumeri:nodejs /usr/src/app
USER viulumeri

EXPOSE 3001


ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/index.js"]
