FROM node:22-alpine
 
WORKDIR /app
 
# Copy package files
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy application source
COPY . .
 
# Build the React application
RUN npm run build
 
# Install static file server
RUN npm install -g serve
 
EXPOSE 5173
 
# For Create React App
CMD ["serve", "-s", "build", "-l", "5173"]