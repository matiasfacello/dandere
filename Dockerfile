FROM node:18.15-alpine3.16

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

COPY package.json /usr/src/bot
RUN npm install

COPY . /usr/src/bot

ARG BOT_TOKEN=${BOT_TOKEN}
ENV BOT_TOKEN=${BOT_TOKEN}

RUN npm run build
RUN npm start
