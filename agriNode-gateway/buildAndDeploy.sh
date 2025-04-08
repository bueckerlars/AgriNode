#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if a tag is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

TAG=$1
IMAGE_NAME="agri-node-gateway"

# Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .

# Deploy the Docker container
echo "Deploying Docker container..."
docker run -d --env-file .env -p 3000:3000 --name $IMAGE_NAME $IMAGE_NAME:$TAG

echo "Docker container deployed with tag $TAG"