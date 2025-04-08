# Use a lightweight Node.js base image
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the application (if needed, e.g., for TypeScript)
RUN npm run build

# Use a smaller runtime image for the final build
FROM node:18-alpine AS runtime

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY package.json ./

EXPOSE 5066

# Start the application
CMD ["node", "dist/index.js"]