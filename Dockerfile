FROM alpine:latest AS builder

WORKDIR /app

RUN apk --no-cache update && apk add nodejs npm

COPY package*.json .

RUN npm ci

COPY . .

RUN npm prune --production

FROM alpine:latest AS production

WORKDIR /app

RUN apk --no-cache update && apk add nodejs

COPY --from=builder /app .

CMD ["node", "--env-file-if-exists", ".env",  "server.js"]