FROM node:20-alpine
WORKDIR /app
COPY microservices ./microservices
WORKDIR /app/microservices/api-gateway
EXPOSE 6100
CMD ["node", "server.js"]
