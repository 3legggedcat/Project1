FROM node:20-alpine
WORKDIR /app
COPY microservices ./microservices
WORKDIR /app/microservices/tags-service
EXPOSE 6003
CMD ["node", "server.js"]
