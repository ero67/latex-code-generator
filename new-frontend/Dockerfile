# Stage 1: Build the React application
FROM node:20-slim as build
WORKDIR /app
COPY package*.json ./
# Use npm install --legacy-peer-deps if you ran into dependency conflicts earlier
RUN npm install 
COPY . .
# NOTE: The build script is usually just 'npm run build' for Vite
RUN npm run build 

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine
# COPY the build output from the 'dist' folder (Vite's default)
COPY --from=build /app/dist /usr/share/nginx/html 
# Copy the default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]