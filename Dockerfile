FROM node:18 as base

RUN yarn add curl && \
    yarn add which && \
    yarn add git && \
    yarn add unzip && \
    apt update -y && \
    apt install python2 -y && \
    npm install -g gatsby-cli

FROM base as npm-install
WORKDIR /var/www
COPY package.json package-lock.json ./
RUN npm install

FROM npm-install as build
WORKDIR /var/www
COPY . ./
RUN gatsby build