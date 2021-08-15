# Stonks Chat Backend

## Run

I created a `docker-compose.yaml` file to layout the pieces of the infrastructure and have the ability to scale up the services.

To get started run `docker-compose up --scale app=<number of instances>`


## Infrastructure

The main chat is a node.js app, built with socket.io and express. In order to be able to scale up in multiple instances and handle big amounts of requests, I used redis as a socket.io adapter. This is because socket.io needs a way to communicate with all instances in order to emit or broadcast to every socket connected.

Also, because we can have multiple instances, I'm using Traefik as a load balancer to handle and routing traffic.

Finally, I am using MongoDB replica sets for database. Also replica sets allows me to scale up as needed. I'm using 3 replicas in this examples, but this could be scaled up to any number.


## Code notes

For authentication, I'm using JwT so I don't need to rely in session handlers.

Both `Io` and `Db` classes are singletons. This is because I want to prevent multiple instantiation of connections and use always the same one.

I included a `stresstest.js` that allows to test sending and receiving messages to the backend. You can edit the constants in the file to change the number of messages, the time it will require to send those messages and how many clients will be sending (and receiving).
The performance of the test will depend on the machine where the test is ran.
More details in file's comments.
This can be run doing `npm run stresstest` with the docker-container running.

I created a couple of basic tests as well that can be run with `npm run test`



## Production deploy

The `docker-compose` is useful to illustrate the intended infraestructure and scaling capabilities, but in real life, a production scenario should involve multiple machines. Ideally a microservices architecture and kubernetes (or similar) and autoscaling rules.



# Developement

I created this in a little less than 4 hours. Everything was straight forward, with the exception of the load balancer. Initially I decided tu use nginx, but because the sticky sessions (needed by socket.io) are handled based on the client IP, the stress test was connecting every client to the same app instance, making the test itself pretty useless. So I changed to Traefik which I wanted to try for a long time.


## What I would liked to add if I had more time

1. An ORM to handle data models (probably mongoose)
2. User + Auth handling (singup/signin)
3. More funtionality like "is typing", users online list, sent-received-read states...
4. A small frontend app to interact with the service
