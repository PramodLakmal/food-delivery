const amqp = require('amqplib');
const DeliveryPerson = require('../models/DeliveryPerson');
const Delivery = require('../models/Delivery');
const { findNearestDeliveryPerson } = require('./assignmentAlgorithm');
const config = require('../config');

let channel = null;
let connection = null;

/**
 * Connect to RabbitMQ message broker
 */
const connectMessageBroker = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.rabbitMQ.url);
    channel = await connection.createChannel();
    
    // Assert exchange
    await channel.assertExchange(config.rabbitMQ.exchange, 'topic', {
      durable: true
    });
    
    console.log('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

/**
 * Publish a message to a specific routing key
 * @param {string} routingKey - The routing key for the message
 * @param {object} message - The message to publish
 */
const publishMessage = async (routingKey, message) => {
  try {
    if (!channel) {
      console.error('Channel not initialized. Connect to message broker first.');
      return;
    }
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    channel.publish(config.rabbitMQ.exchange, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json'
    });
    
    console.log(`Published message to ${routingKey}:`, message);
  } catch (error) {
    console.error(`Error publishing message to ${routingKey}:`, error);
    throw error;
  }
};

/**
 * Consume messages from a specific routing key
 * @param {string} routingKey - The routing key to consume messages from
 * @param {function} callback - The callback function to handle messages
 */
const consumeMessage = async (routingKey, callback) => {
  try {
    if (!channel) {
      console.error('Channel not initialized. Connect to message broker first.');
      return;
    }
    
    // Create a queue for this service
    const queueName = `delivery-service.${routingKey}`;
    await channel.assertQueue(queueName, {
      durable: true
    });
    
    // Bind the queue to the exchange with the routing key
    await channel.bindQueue(queueName, config.rabbitMQ.exchange, routingKey);
    
    // Consume messages
    await channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        const message = JSON.parse(msg.content.toString());
        console.log(`Received message from ${routingKey}:`, message);
        
        // Process message with callback
        await callback(message);
        
        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        console.error(`Error processing message from ${routingKey}:`, error);
        // Reject the message and requeue
        channel.nack(msg, false, true);
      }
    });
    
    console.log(`Consuming messages from ${routingKey}`);
  } catch (error) {
    console.error(`Error consuming messages from ${routingKey}:`, error);
    throw error;
  }
};

/**
 * Close the connection to the message broker
 */
const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    
    if (connection) {
      await connection.close();
    }
    
    console.log('Closed connection to RabbitMQ');
  } catch (error) {
    console.error('Error closing connection to RabbitMQ:', error);
    throw error;
  }
};

// RabbitMQ connection URL
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Exchange and queue names
const EXCHANGE_NAME = 'food_delivery';
const DELIVERY_QUEUE = 'delivery_service_queue';

// Connect to RabbitMQ
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    // Assert exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Assert queue
    await channel.assertQueue(DELIVERY_QUEUE, { durable: true });
    
    // Bind queue to exchange with routing keys
    await channel.bindQueue(DELIVERY_QUEUE, EXCHANGE_NAME, 'order.confirmed');
    await channel.bindQueue(DELIVERY_QUEUE, EXCHANGE_NAME, 'order.ready');
    await channel.bindQueue(DELIVERY_QUEUE, EXCHANGE_NAME, 'user.registered');
    
    console.log('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
}

// Set up consumer to listen for messages
async function setupConsumer() {
  const { channel } = await connectToRabbitMQ();
  
  channel.consume(DELIVERY_QUEUE, async (msg) => {
    try {
      if (!msg) return;
      
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Received message with routing key: ${routingKey}`);
      console.log('Message content:', content);
      
      switch (routingKey) {
        case 'order.confirmed':
          await handleOrderConfirmed(content);
          break;
        case 'order.ready':
          await handleOrderReady(content);
          break;
        case 'user.registered':
          await handleUserRegistered(content);
          break;
        default:
          console.log(`No handler for routing key: ${routingKey}`);
      }
      
      // Acknowledge the message
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing message:', error);
      // Reject the message and requeue
      channel.nack(msg, false, true);
    }
  });
}

// Handle order confirmed event
async function handleOrderConfirmed(data) {
  try {
    const { orderId, orderNumber, restaurantId, restaurantName, restaurantLocation, customerId, customerName, customerPhone, deliveryAddress, specialInstructions } = data;
    
    // Create a new delivery record
    const delivery = new Delivery({
      orderId,
      orderNumber,
      restaurantId,
      restaurantName,
      restaurantLocation,
      customerId,
      customerName,
      customerPhone,
      deliveryAddress,
      specialInstructions,
      status: 'pending_assignment'
    });
    
    await delivery.save();
    
    // Find the nearest available delivery person
    const nearestDeliveryPerson = await findNearestDeliveryPerson(restaurantLocation);
    
    if (nearestDeliveryPerson) {
      // Assign the delivery to the nearest delivery person
      delivery.deliveryPersonId = nearestDeliveryPerson._id;
      delivery.deliveryPersonName = nearestDeliveryPerson.name;
      delivery.deliveryPersonPhone = nearestDeliveryPerson.phone;
      delivery.status = 'assigned';
      delivery.assignedAt = new Date();
      
      // Add tracking history
      delivery.trackingHistory.push({
        status: 'assigned',
        timestamp: new Date(),
        note: `Assigned to ${nearestDeliveryPerson.name}`
      });
      
      await delivery.save();
      
      // Update delivery person's status
      nearestDeliveryPerson.isAvailable = false;
      nearestDeliveryPerson.currentOrderId = delivery._id;
      await nearestDeliveryPerson.save();
      
      // Publish delivery assigned event
      await publishMessage('delivery.assigned', {
        deliveryId: delivery._id,
        orderId: delivery.orderId,
        orderNumber: delivery.orderNumber,
        deliveryPersonId: nearestDeliveryPerson._id,
        deliveryPersonName: nearestDeliveryPerson.name,
        deliveryPersonPhone: nearestDeliveryPerson.phone
      });
    } else {
      console.log(`No available delivery person found for order ${orderNumber}`);
      
      // Add tracking history
      delivery.trackingHistory.push({
        status: 'pending_assignment',
        timestamp: new Date(),
        note: 'No available delivery person found'
      });
      
      await delivery.save();
    }
  } catch (error) {
    console.error('Error handling order confirmed event:', error);
    throw error;
  }
}

// Handle order ready event
async function handleOrderReady(data) {
  try {
    const { orderId } = data;
    
    // Find the delivery
    const delivery = await Delivery.findOne({ orderId });
    
    if (!delivery) {
      console.error(`Delivery not found for order ${orderId}`);
      return;
    }
    
    // Update delivery status
    delivery.status = 'picked_up';
    delivery.pickedUpAt = new Date();
    
    // Add tracking history
    delivery.trackingHistory.push({
      status: 'picked_up',
      timestamp: new Date(),
      note: 'Order picked up from restaurant'
    });
    
    await delivery.save();
    
    // Publish delivery picked up event
    await publishMessage('delivery.picked_up', {
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      orderNumber: delivery.orderNumber,
      deliveryPersonId: delivery.deliveryPersonId,
      deliveryPersonName: delivery.deliveryPersonName
    });
  } catch (error) {
    console.error('Error handling order ready event:', error);
    throw error;
  }
}

// Handle user registered event
async function handleUserRegistered(data) {
  try {
    // Only process if the user is a delivery person
    if (data.role !== 'delivery_person') {
      return;
    }
    
    const { userId, name, email, phone } = data;
    
    // Check if delivery person already exists
    const existingDeliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (existingDeliveryPerson) {
      console.log(`Delivery person already exists for user ${userId}`);
      return;
    }
    
    // Create a new delivery person record
    const deliveryPerson = new DeliveryPerson({
      userId,
      name,
      email,
      phone,
      isAvailable: true,
      isActive: true,
      isVerified: false
    });
    
    await deliveryPerson.save();
    
    console.log(`Created new delivery person record for user ${userId}`);
  } catch (error) {
    console.error('Error handling user registered event:', error);
    throw error;
  }
}

module.exports = {
  connectMessageBroker,
  publishMessage,
  consumeMessage,
  closeConnection,
  connectToRabbitMQ,
  setupConsumer
}; 