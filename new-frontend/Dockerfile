# Stage 1: Build the React application
FROM node:20-slim as build
WORKDIR /app
COPY package*.json ./
# Use npm install --legacy-peer-deps if you ran into dependency conflicts earlier
RUN npm install 
COPY . .
# NOTE: Use development build for local testing, production build for deployment
# For local development, use: RUN npm run build:dev
# For production deployment, use: RUN npm run build
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine
# COPY the build output from the 'dist' folder (Vite's default)
COPY --from=build /app/dist /usr/share/nginx/html 
# Copy the default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]