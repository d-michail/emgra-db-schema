FROM node:23-slim

RUN mkdir -p /home/node/app
RUN chown node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node init/ init/
COPY --chown=node:node migrations migrations
