# Food Delivery Application - Kubernetes Deployment

This directory contains Kubernetes configuration files for deploying the Food Delivery application.

## Prerequisites

1. Kubernetes cluster (Docker Desktop with Kubernetes enabled)
2. kubectl CLI tool installed
3. Docker images for all services built and available locally (they should have been built by docker-compose)

## Deployment Steps

### Windows

1. Open a command prompt in this directory
2. Run the deployment script:
   ```
   deploy.bat
   ```
3. Wait for all services to start up (this may take a few minutes)
4. Access the application at http://localhost:30080

### Linux/Mac

1. Open a terminal in this directory
2. Make the script executable:
   ```
   chmod +x deploy.sh
   ```
3. Run the deployment script:
   ```
   ./deploy.sh
   ```
4. Wait for all services to start up (this may take a few minutes)
5. Access the application at http://localhost:30080

## Manual Deployment

If you prefer to deploy services manually or in a specific order:

1. Create the namespace:
   ```
   kubectl create namespace food-delivery
   ```

2. Deploy infrastructure services:
   ```
   kubectl apply -f mongodb-deployment.yaml -n food-delivery
   kubectl apply -f rabbitmq-deployment.yaml -n food-delivery
   ```

3. Deploy backend services:
   ```
   kubectl apply -f user-service-deployment.yaml -n food-delivery
   kubectl apply -f notification-service-deployment.yaml -n food-delivery
   kubectl apply -f restaurant-service-deployment.yaml -n food-delivery
   kubectl apply -f order-service-deployment.yaml -n food-delivery
   kubectl apply -f delivery-service-deployment.yaml -n food-delivery
   kubectl apply -f api-gateway-deployment.yaml -n food-delivery
   ```

4. Deploy frontend:
   ```
   kubectl apply -f frontend-deployment.yaml -n food-delivery
   ```

## Cleanup

To remove all deployed resources:

### Windows
```
cleanup.bat
```

### Linux/Mac
```
kubectl delete namespace food-delivery
```

## Verifying Deployment

Check the status of all pods:
```
kubectl get pods -n food-delivery
```

Check the status of all services:
```
kubectl get services -n food-delivery
```

## Accessing Services

- Frontend: http://localhost:30080
- API Gateway: Available within the cluster at http://api-gateway:3000 