FROM node:14.19.1-bullseye as base

WORKDIR /app

RUN apt update
RUN apt install -y make python build-essential tzdata

ENV TZ="America/Argentina/Salta"

COPY assets/latino.deb latino.deb
RUN dpkg -i latino.deb

FROM base as prod

COPY package.json /app/

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
