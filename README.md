# Food Ordering System - Microservices Architecture

This is a food ordering system built with a microservices architecture using Node.js, Express, MongoDB, and RabbitMQ.

## Project Structure

The system is divided into multiple microservices:

- **API Gateway**: Entry point for all client requests, handles routing to appropriate services
- **User Service**: Manages user authentication, profiles, and roles
- **Notification Service**: Handles sending notifications via email
- (Future services will include Order Service, Restaurant Service, and Delivery Service)

## Technologies Used

- **Node.js & Express**: For building the services
- **MongoDB**: As the database for each service
- **RabbitMQ**: For asynchronous communication between services
- **JWT**: For authentication and authorization
- **Docker**: For containerization (in production)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- RabbitMQ

### Installation

1. Clone the repository
2. Set up environment variables for each service (copy .env.example to .env in each service directory)
3. Install dependencies for each service:

```bash
cd user-service && npm install
cd notification-service && npm install
cd api-gateway && npm install
```

4. Start each service:

```bash
# In separate terminals
cd user-service && npm run dev
cd notification-service && npm run dev
cd api-gateway && npm run dev
```

## Service Details

### API Gateway (Port 3000)

The API Gateway serves as the entry point for all client requests. It handles:

- Routing requests to appropriate microservices
- Authentication and authorization
- Rate limiting
- Request/response logging

### User Service (Port 3001)

The User Service manages:

- User registration and authentication
- User profiles
- Role-based access control (Customer, Restaurant Admin, Delivery Person, System Admin)

### Notification Service (Port 3002)

The Notification Service handles:

- Email notifications
- Templated messages
- Notification history

## API Documentation

### User Service Endpoints

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user
- PUT /api/auth/change-password - Change password
- GET /api/users - Get all users (admin only)
- GET /api/users/:id - Get user by ID
- PUT /api/users/:id - Update user
- PUT /api/users/:id/role - Change user role (admin only)
- PUT /api/users/:id/status - Activate/deactivate user (admin only)

### Notification Service Endpoints

- GET /api/notifications - Get notifications with filters
- GET /api/notifications/:id - Get notification by ID
- POST /api/notifications/send - Send notification
- GET /api/notifications/templates - Get all templates
- GET /api/notifications/templates/:id - Get template by ID
- POST /api/notifications/templates - Create template
- PUT /api/notifications/templates/:id - Update template

## Message Broker Events

The system uses RabbitMQ for asynchronous communication:

- user.registered - When a new user registers
- user.login - When a user logs in
- user.updated - When a user profile is updated
- user.password_changed - When a user changes password
- user.role_changed - When a user's role is changed
- user.status_changed - When a user is activated/deactivated

## Future Enhancements

- Order Service for managing food orders
- Restaurant Service for managing restaurant listings and menus
- Delivery Service for managing delivery logistics
- Payment Service for handling payments
- Docker and Kubernetes configuration for deployment
- Comprehensive test coverage

## License

This project is licensed under the MIT License. 
 
 