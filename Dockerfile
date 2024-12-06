# Step 1: Build the application
FROM node:-alpine AS build

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Step 4: Install dependencies
RUN yarn install

# Step 5: Copy the entire application source code
COPY . .

# Step 6: Build the Vue.js application
RUN yarn run build

# Step 7: Serve the application with NGINX
FROM nginx:alpine

# Step 8: Copy the built application from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Replace the default NGINX configuration with a custom one
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Step 10: Expose port 80
EXPOSE 80

# Step 11: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]