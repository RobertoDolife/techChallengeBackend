FROM alpine:latest

WORKDIR /app

RUN apk --no-cache update && apk add nodejs npm

COPY package*.json ./

RUN npm ci --only=production

COPY . .

CMD ["node", "--env-file-if-exists", ".env",  "server.js"]