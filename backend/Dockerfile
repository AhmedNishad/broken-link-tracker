FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (Now handled via compose)
# RabbitMQ
# Mongo

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Wait for it script to start the package ( So that rabbitMQ is initalized before the service calls it)
RUN wget -O /bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /bin/wait-for-it.sh

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "run",  "build" ]