#!/bin/bash

# Create namespace
kubectl create namespace food-delivery

# Apply infrastructure services
kubectl apply -f mongodb-deployment.yaml -n food-delivery
kubectl apply -f rabbitmq-deployment.yaml -n food-delivery

# Wait for infrastructure to be ready
echo "Waiting for MongoDB and RabbitMQ to start..."
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n food-delivery
kubectl wait --for=condition=available --timeout=300s deployment/rabbitmq -n food-delivery

# Apply backend services
kubectl apply -f user-service-deployment.yaml -n food-delivery
kubectl apply -f notification-service-deployment.yaml -n food-delivery
kubectl apply -f restaurant-service-deployment.yaml -n food-delivery
kubectl apply -f order-service-deployment.yaml -n food-delivery
kubectl apply -f delivery-service-deployment.yaml -n food-delivery
kubectl apply -f api-gateway-deployment.yaml -n food-delivery

# Apply frontend
kubectl apply -f frontend-deployment.yaml -n food-delivery

echo "All resources deployed! Frontend will be available at http://localhost:30080" 