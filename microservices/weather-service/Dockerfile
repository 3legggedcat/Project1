FROM node:20-alpine
WORKDIR /app
COPY microservices ./microservices
WORKDIR /app/microservices/weather-service
EXPOSE 6004
CMD ["node", "server.js"]
