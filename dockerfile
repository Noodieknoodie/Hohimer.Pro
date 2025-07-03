# Dockerfile

# ---- Builder Stage ----
# Use a full Node.js image to build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
# This will use your tsconfig.json to output files to the /lib directory
RUN npm run build


# ---- Production Stage ----
# Use a slim Node.js image for the final container
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/lib ./lib
COPY --from=builder /usr/src/app/src/views ./src/views
COPY --from=builder /usr/src/app/src/static/favicon.ico ./src/static/favicon.ico

# Install ONLY production dependencies
RUN npm install --omit=dev

# Expose the port the app runs on
EXPOSE 53000

# The command to start the application
CMD [ "node", "lib/app.js" ]