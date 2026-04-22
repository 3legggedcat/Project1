# Microservices High-Level Design

## Overview
This microservices design breaks the original notes application into small independently deployable services behind a single API Gateway. The goal is to improve modularity, scalability, and service isolation while keeping the implementation simple enough for local development.

## Services
### API Gateway
- Entry point for client traffic.
- Routes `/api/users`, `/api/notes`, `/api/tags`, and `/api/weather` to the correct backend service.
- Provides `/api/dashboard` as an aggregation endpoint.

### Users Service
- Owns user records.
- Stores its data in `microservices/users-service/data/users.json`.
- Exposes `GET /users` and `POST /users`.

### Notes Service
- Owns note records.
- Stores its data in `microservices/notes-service/data/notes.json`.
- Exposes `GET /notes`, `POST /notes`, and `DELETE /notes/:id`.
- References `userId` and `tagIds` as plain IDs to avoid direct database coupling.

### Tags Service
- Owns tag records.
- Stores its data in `microservices/tags-service/data/tags.json`.
- Exposes `GET /tags` and `POST /tags`.

### Weather Service
- Provides simple weather lookups for a requested city.
- Reads weather samples from `microservices/weather-service/data/catalog.json`.
- Stores recent request history in `microservices/weather-service/data/requests.json`.
- Exposes `GET /weather?city=phoenix`.

## Data Ownership
- Each microservice has its own storage and does not read or write another service's data.
- The gateway aggregates responses through HTTP calls rather than shared tables or direct file access.
- This keeps service boundaries clear and supports future replacement of JSON storage with isolated databases.

## Statelessness
- Request handling is stateless at the application layer.
- Persistent state is externalized into per-service JSON files mounted into each container.
- Any instance of a service can handle a request as long as it can reach its own storage volume.

## Request Flow
1. The client sends a request to the API Gateway on port `6100`.
2. The gateway forwards the request to the matching service.
3. The target service handles the request using only its own storage.
4. The response is returned through the gateway.

## Ports
- API Gateway: `6100`
- Users Service: `6001`
- Notes Service: `6002`
- Tags Service: `6003`
- Weather Service: `6004`

## Container Strategy
- Each service has its own Dockerfile.
- `docker-compose.yml` orchestrates the full stack for local testing.
- Named volumes provide isolated persistent storage for each service.
