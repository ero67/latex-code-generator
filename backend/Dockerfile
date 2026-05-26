# Stage 1: Build Stage (Handles Compilation)
FROM node:20-slim as build-stage
WORKDIR /app
COPY package*.json ./

# Install all dependencies (including dev) needed for the TypeScript build
RUN npm install
# Copy all source files before building
COPY . . 

# Run the build script (compiles TypeScript to JavaScript into the 'dist' folder)
# This command MUST create the 'dist' directory.
RUN npm run build 

# Stage 2: Production Stage (Smaller runtime environment)
FROM node:20-slim
WORKDIR /usr/src/app

# Copy only production files and dependencies
COPY package*.json ./ 
RUN npm install --production

# CRITICAL STEP: Copy the compiled JavaScript and the node_modules
# Copy the compiled code from the build stage's output folder
COPY --from=build-stage /app/dist ./dist

EXPOSE 3001
# The start script will successfully find the compiled file here: /usr/src/app/dist/server.js
CMD ["npm", "run", "start"]