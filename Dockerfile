FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache make gcc g++ python3 && \
    npm install && \
    npm rebuild bcrypt --build-from-source && \
    apk del make gcc g++ python3

COPY . .

EXPOSE 3002

CMD ["node", "index.js"]