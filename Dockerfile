FROM node:latest

WORKDIR /usr/src/beader-api

ADD package* ./
RUN ["npm", "i"]

ADD . .

CMD [ "npm", "run", "start" ]
