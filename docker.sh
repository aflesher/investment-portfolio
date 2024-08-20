#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

# Function to stop and remove the container and image if they exist
stop_and_remove() {
    CONTAINER_ID=$(docker ps -q --filter ancestor=investment-portfolio:latest)
    if [ ! -z "$CONTAINER_ID" ]; then
        docker stop "$CONTAINER_ID"
        docker rm "$CONTAINER_ID"
    fi

    IMAGE_ID=$(docker images -q investment-portfolio:latest)
    if [ ! -z "$IMAGE_ID" ]; then
        docker rmi investment-portfolio:latest
    fi
}

# Check for the optional argument
if [ "$1" == "--stop-only" ]; then
    stop_and_remove
    echo "Stopped and removed the container and image."
    exit 0
fi

# Default behavior: stop, remove, build, and run
stop_and_remove

# Build the new image
docker build . --tag investment-portfolio:latest

# Run the new image
docker run -d -p 80:80 investment-portfolio:latest

echo "Built and ran the new image."