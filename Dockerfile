FROM node:18
WORKDIR /app
COPY package*.json ./
RUN mkdir -p public/uploads/posts
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
