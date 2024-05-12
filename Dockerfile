FROM node:18 as base
RUN npm install -g gatsby-cli

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

FROM nginx:alpine
COPY --from=build /var/www/public /usr/share/nginx/html