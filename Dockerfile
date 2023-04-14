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

FROM npm-install as gatsby-nodes
COPY ./plugins /var/www/plugins
WORKDIR /var/www/plugins/gatsby-source-portfolio
RUN npx tsc --build tsconfig.json

FROM npm-install as build
WORKDIR /var/www
COPY . ./
COPY --from=gatsby-nodes /var/www/plugins /var/www/plugins
RUN npm run build

FROM python:latest
COPY --from=build /var/www/public /var/www/public
WORKDIR /var/www/public
EXPOSE 7000
CMD python -m http.server 7000