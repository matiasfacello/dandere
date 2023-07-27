FROM node:18.15-alpine3.16

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

COPY package.json /usr/src/bot

RUN npm install

COPY . /usr/src/bot

ARG BOT_TOKEN=${BOT_TOKEN}
ENV BOT_TOKEN=${BOT_TOKEN}
ARG APP_ID=${APP_ID}
ENV APP_ID=${APP_ID}
ARG DATABASE_URL=${DATABASE_URL}
ENV DATABASE_URL=${DATABASE_URL}


CMD ["npm", "start"]