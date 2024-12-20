# Use a lightweight Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy the rest of the application files
COPY ./dist .

# Expose the PORT environment variable for the app
EXPOSE ${PORT}

# Command to start the application
CMD ["node", "index.js"]
