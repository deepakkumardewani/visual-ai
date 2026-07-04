# Step 1: Use a Node.js base image
FROM node:20-alpine

# Step 2: Set the working directory in the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Step 4: Install dependencies
RUN yarn install

# Step 5: Copy the source files
COPY . .

# Step 6: Build TypeScript into JavaScript
RUN npm run build

# Step 7: Expose the application's port
EXPOSE 3001

# Step 8: Start the application
CMD ["npm", "run", "start"]
