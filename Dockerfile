FROM node:22.11.0-alpine3.20

RUN npm install -g pnpm@11.1.1

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /usr/src/bot/

RUN pnpm install --frozen-lockfile

COPY . /usr/src/bot

CMD ["pnpm", "run", "prod"]
