const amqp = require('amqplib');

let channel = null;

// Connect to RabbitMQ
const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Create order events exchange
    await channel.assertExchange('order_events', 'topic', { durable: true });
    
    console.log('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error.message);
    // Retry connection after delay
    setTimeout(connectToRabbitMQ, 5000);
    return null;
  }
};

// Subscribe to messages from a specific exchange and routing pattern
const subscribeToEvents = async (exchange, routingPattern, callback) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not established');
    }
    
    // Assert exchange
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    // Create queue for order service
    const { queue } = await channel.assertQueue('order_queue', { durable: true });
    
    // Bind queue to exchange with routing key
    await channel.bindQueue(queue, exchange, routingPattern);
    
    // Consume messages
    channel.consume(queue, (msg) => {
      if (msg) {
        console.log(`Received message from ${exchange}:${msg.fields.routingKey}`);
        
        try {
          const content = JSON.parse(msg.content.toString());
          callback(msg.fields.routingKey, content);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error.message);
          // Requeue message if processing fails
          channel.nack(msg, false, false);
        }
      }
    });
    
    console.log(`Subscribed to ${exchange}:${routingPattern}`);
    return true;
  } catch (error) {
    console.error('Error subscribing to events:', error.message);
    return false;
  }
};

// Publish message to RabbitMQ
const publishEvent = async (routingKey, data) => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not established');
      return false;
    }
    
    const exchange = 'order_events';
    
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );
    
    console.log(`Published event to ${exchange}:${routingKey}`);
    return true;
  } catch (error) {
    console.error('Error publishing event:', error.message);
    return false;
  }
};

module.exports = {
  connectToRabbitMQ,
  subscribeToEvents,
  publishEvent
}; 
 
 
 
 