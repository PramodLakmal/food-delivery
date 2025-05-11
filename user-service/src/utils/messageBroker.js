const amqp = require('amqplib');

let channel = null;

// Connect to RabbitMQ
const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Create exchange for user service messages
    await channel.assertExchange('user_events', 'topic', { durable: true });
    
    console.log('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error.message);
    // Retry connection after delay
    setTimeout(connectToRabbitMQ, 5000);
  }
};

// Publish message to RabbitMQ
const publishMessage = (routingKey, message) => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not established');
      return false;
    }
    
    const exchange = 'user_events';
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    console.log(`Message published to ${exchange}:${routingKey}`);
    return true;
  } catch (error) {
    console.error('Error publishing message:', error.message);
    return false;
  }
};

// Subscribe to messages
const subscribeToMessages = async (exchange, routingKey, callback) => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not established');
      return false;
    }
    
    // Create queue for this service
    const { queue } = await channel.assertQueue('', { exclusive: true });
    
    // Bind queue to exchange with routing key
    await channel.bindQueue(queue, exchange, routingKey);
    
    // Consume messages
    channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        channel.ack(msg);
      }
    });
    
    console.log(`Subscribed to ${exchange}:${routingKey}`);
    return true;
  } catch (error) {
    console.error('Error subscribing to messages:', error.message);
    return false;
  }
};

module.exports = {
  connectToRabbitMQ,
  publishMessage,
  subscribeToMessages
}; 
 
 