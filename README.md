# Project 2
## Overview
Our system is an application built for users to add notes to a list, for them to be stored, and for them to be deleted if needed. A practical use of this system is for having multiple members of a class adding notes about lectures and assignments to one comprehensive list in a neat format.
The technologies we used were html and javascript. Since our system is fairly simple, all we needed were these technologies. The html is present throughout the application, and everytime a user interacts with a button the javascript comes into play. In future iterations, we will use CSS to create a better design of the site.
## Getting started
* Must have git installed to clone repsitory on terminal.
* Must have node installed tp run server.js
### Steps
* Clone the repository
    ```Bash
    git clone <URL for repo>
    ```
* Open the file path
    ```Bash
    cd Project1
    ```
* Change directory to the architecture
    ```Bash
    cd architecture
    ```
* Change directory to the architecture type
    ```Bash
    cd "architecture type"
    ```
* Starting the local webpage
    ```Bash
    node server.js
    ```
* The terminal will give you the localhost with the correct port to run
* Enter the localhost with port on a webpage
## Architectural Styles
### Monolithic 
#### Rational
We chose a monolithic architecture because the original application is small and has a simple flow. A single Node.js file application keeps everything in one area which in this case is easy to navigate.
#### Source Code Link
[Monolithic](https://github.com/3legggedcat/Project1/edit/main/architectures/monolithic)
#### High Level Architecture Diagrams
![Alt text](image/monolithic.png)
#### Analysis Report
* Maintainability is limited as there isn't a clear structure to the code, but it is easy to navigate as it is a small system.
* Scalability is limited as the structure is not well defined.
* Complexity using monolithic architecture is minimal as this is a simple notes application that is in one file.
#### Recommendation
Monolithic architecture is good for small rapid build projects as it is a simple architecture. We would recommend using this architecture if there is no need to expand the code base or project from this point on.
### Event-Driven 
#### Rational
We used event driven architecture because our system has clear action, creation and deletion of notes. Those two features would become the events in the systems, improving scalability for future features. 
#### Source Code Link
[Event Driven](https://github.com/3legggedcat/Project1/edit/main/architectures/event-driven)
#### High Level Architecture Diagrams
![Alt text](image/event.png)
#### Analysis Report
* Performance is more expensive as this system has event storage and projection updates.
* Scalability is better, with defined modular functions.
* Complexity is higher because developers must reason events and projection separately.
#### Recommendation
This project is not a highly scalable project therefore event driven is not needed. If you needed a complex workflow with high throughput, many users added notes in a short time frame that gets uploaded to a cloud, then event driven architecture would be a great architecture to use.
### Pipe and Filter 
#### Rational
We used Pipe and Filter architecture because the system has a predictable sequence when adding or deleting a note. We can break the workflow into separate filter making a reusable and easier to test system.
#### Source Code Link
[Pipe and Filter](https://github.com/3legggedcat/Project1/edit/main/architectures/pipe-and-filter)
#### High Level Architectire Diagrams
![Alt text](image/pipe.png)
#### Analysis Report
* Performance is good as each request passes through a lightweight filter.
* Maintainability is improved because each filter has one responsibility and is separate from others.
* Complexity is moderate since stages must be coordinated.
#### Recommendation
Using a pipe and filter for a project like this is not necessary because there isn't a complex task that needs to be broken down. We would recommend using this type of architecture if you have a login where you would need to change the step to create a note and delete a note.
## Reflection
Looking at these three architectural designs we have learned when to use them and when not to use them. Understanding different styles of architecture can influence where time, funds, and manpower should be allocated.










# Project 1
## Overview
Our system is an application built for users to add notes to a list, for them to be stored, and for them to be deleted if needed. A pratical use of this system is for having a multiple members of a class adding notes about lectures and assignments to one comprehensive list in a neat format.
The technologies we used were html and javascript. Since our system is fairly simple, all we needed were these technologies. The html is present throughout the application, and everytime a user interacts with a button the javascript comes into play. In future iterations, we will use CSS to create a better design of the site.

## How to run
* Must have git installed to clone repsitory on terminal.
* Must have WSL on windows to run node, can run through VS code terminal.
* Clone the repository
    ```Bash
    git clone <URL for repo>
    ```
* Open the file path
    ```Bash
    cd Project1
    ```
* Starting the local webpage
    ```Bash
    node server.js
    ```
## UML Diagrams
### Use Case
![Alt text](image/usecase.PNG)
### State Diagrams
![Alt text](image/state.png)
![Alt text](image/state1.png)

### Class Diagrams
![Alt text](image/class.PNG)

### Activity Diagram
![Alt text](image/activity.png)

### Package Diagram
![Alt text](image/package.png)

### Component Diagrams
![Alt text](image/component.png)

## Video of Project
Click the image below &darr;
<br>
[![Watch the video](image/thumbnail.png)](https://youtu.be/BdYPwQtZlyI)

## Microservices Implementation
This repository now also includes a microservices-based version of the project in the `microservices/` folder.

### Services
* `users-service` on port `6001`
* `notes-service` on port `6002`
* `tags-service` on port `6003`
* `weather-service` on port `6004`
* `api-gateway` on port `6100`

### High-Level Design Document
* See [docs/microservices-design.md](docs/microservices-design.md)

### Local Run Without Docker
Open five terminals from the project root and run:

```bash
node microservices/users-service/server.js
node microservices/notes-service/server.js
node microservices/tags-service/server.js
node microservices/weather-service/server.js
node microservices/api-gateway/server.js
```

Then open the Project 3 UI at `http://localhost:6100`.

The gateway now serves a frontend that matches the same general Project 2 layout and styling approach while using the microservices backend.

Example requests:

```bash
curl -X POST http://localhost:6100/api/users -H "Content-Type: application/json" -d "{\"name\":\"Ava\",\"email\":\"ava@example.com\"}"
curl -X POST http://localhost:6100/api/tags -H "Content-Type: application/json" -d "{\"name\":\"lecture\",\"color\":\"#2563eb\"}"
curl http://localhost:6100/api/users
curl http://localhost:6100/api/tags
curl "http://localhost:6100/api/weather?city=phoenix"
curl http://localhost:6100/api/dashboard
```

### Run With Docker Compose
From the project root:

```bash
docker compose up --build
```

The API Gateway will be available at `http://localhost:6100`.
Open that URL in a browser to use the Project 3 frontend.

To stop the stack:

```bash
docker compose down
```

