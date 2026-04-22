FROM node:20-alpine
WORKDIR /app
COPY microservices ./microservices
WORKDIR /app/microservices/users-service
EXPOSE 6001
CMD ["node", "server.js"]
