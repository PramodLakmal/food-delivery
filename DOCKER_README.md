# Food Delivery Application - Docker Setup

This document provides instructions on how to run the Food Delivery application using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Services

The application consists of the following services:

1. **MongoDB** - Database for all services
2. **RabbitMQ** - Message broker for inter-service communication
3. **API Gateway** - Entry point for all API requests
4. **User Service** - Handles user authentication and management
5. **Restaurant Service** - Manages restaurant information and menus
6. **Order Service** - Processes and manages orders
7. **Delivery Service** - Handles delivery assignments and tracking
8. **Notification Service** - Sends notifications to users
9. **Frontend** - React web application

## Running the Application

### Using Docker Compose Directly

1. Clone the repository:
   ```
   git clone <repository-url>
   cd food-delivery
   ```

2. Build and start all services:
   ```
   docker-compose up -d
   ```

3. To view logs for all services:
   ```
   docker-compose logs -f
   ```

4. To view logs for a specific service:
   ```
   docker-compose logs -f <service-name>
   ```
   Example: `docker-compose logs -f api-gateway`

### Using the Helper Script

We've provided a helper script to make Docker operations easier:

#### For Unix-based systems (Linux/MacOS):

1. Make the script executable:
   ```
   chmod +x docker-commands.sh
   ```

2. Run the script:
   ```
   ./docker-commands.sh start
   ```

#### For Windows:

1. Using PowerShell:
   ```
   .\docker-commands.sh start
   ```

2. Alternatively, you can use the following Docker Compose commands directly:
   ```
   docker-compose up -d
   docker-compose logs -f
   docker-compose down
   ```

## Accessing the Application

- Frontend: http://localhost
- API Gateway: http://localhost:3000
- RabbitMQ Management UI: http://localhost:15672 (username: guest, password: guest)

## Stopping the Application

To stop all services:
```
docker-compose down
```

To stop all services and remove volumes (this will delete all data):
```
docker-compose down -v
```

## Environment Variables

The Docker Compose file includes default environment variables for development. For production, you should modify these values or use environment-specific Docker Compose files.

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration.

## Troubleshooting

If you encounter any issues:

1. Check the logs for the specific service:
   ```
   docker-compose logs -f <service-name>
   ```

2. Restart a specific service:
   ```
   docker-compose restart <service-name>
   ```

3. Rebuild a specific service:
   ```
   docker-compose build <service-name>
   docker-compose up -d <service-name>
   ```

4. If you're on Windows and encounter issues with line endings in shell scripts, run:
   ```
   git config --global core.autocrlf false
   ```
   Then clone the repository again. 