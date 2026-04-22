FROM node:20-alpine
WORKDIR /app
COPY microservices ./microservices
WORKDIR /app/microservices/notes-service
EXPOSE 6002
CMD ["node", "server.js"]
