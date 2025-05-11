# Delivery Service

This microservice handles the delivery operations for the food delivery application. It manages delivery assignments, tracking, and status updates.

## Features

- Delivery creation and assignment
- Delivery person management
- Real-time delivery tracking
- Status updates and notifications
- Integration with order service

## API Endpoints

### Delivery Routes

- `GET /api/deliveries/:deliveryId` - Get delivery by ID
- `GET /api/deliveries/order/:orderId` - Get delivery by order ID
- `GET /api/deliveries/:deliveryId/tracking` - Get delivery tracking information
- `POST /api/deliveries/:deliveryId/assign` - Manually assign delivery person to delivery
- `POST /api/deliveries/nearest` - Find nearest delivery person
- `GET /api/deliveries` - Get all active deliveries (admin only)
- `GET /api/deliveries/restaurant/:restaurantId` - Get restaurant deliveries

### Delivery Person Routes

- `GET /api/delivery-persons/profile` - Get delivery person profile
- `POST /api/delivery-persons/complete-profile` - Complete delivery person profile
- `POST /api/delivery-persons/location` - Update current location
- `GET /api/delivery-persons/current-delivery` - Get current delivery
- `PUT /api/delivery-persons/deliveries/:deliveryId/status` - Update delivery status
- `GET /api/delivery-persons/history` - Get delivery history
- `PUT /api/delivery-persons/availability` - Toggle availability status

## Message Broker Events

### Consumed Events

- `order.confirmed` - When an order is confirmed, create a new delivery
- `order.cancelled` - When an order is cancelled, cancel the delivery
- `delivery.status.update` - Update delivery status
- `delivery.location.update` - Update delivery person location

### Published Events

- `delivery.created` - When a new delivery is created
- `delivery.assigned` - When a delivery is assigned to a delivery person
- `delivery.status.updated` - When delivery status is updated
- `delivery.tracking.update` - When delivery person location is updated
- `delivery.cancelled` - When a delivery is cancelled

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5003
   MONGO_URI=mongodb://localhost:27017/delivery-service
   JWT_SECRET=your_jwt_secret
   RABBITMQ_URL=amqp://localhost
   RABBITMQ_EXCHANGE=food_delivery
   ORDER_SERVICE_URL=http://localhost:5002
   USER_SERVICE_URL=http://localhost:5001
   RESTAURANT_SERVICE_URL=http://localhost:5004
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   AUTO_ASSIGNMENT_ENABLED=true
   MAX_DELIVERY_DISTANCE=10000
   ```
4. Start the service:
   ```
   npm start
   ```
   or for development:
   ```
   npm run dev
   ```

## Dependencies

- Express - Web framework
- Mongoose - MongoDB ORM
- amqplib - RabbitMQ client
- axios - HTTP client
- jsonwebtoken - JWT authentication
- dotenv - Environment variables
- cors - CORS middleware
- helmet - Security middleware
- morgan - HTTP request logger

## Architecture

The delivery service follows a microservice architecture pattern and communicates with other services via REST APIs and message broker events. It uses MongoDB for data storage and RabbitMQ for event-driven communication. 