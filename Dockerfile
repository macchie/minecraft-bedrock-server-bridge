# Stage 0
FROM node:14-alpine as build-stage

# Create app directory
WORKDIR /minecraft-bds-bridge

# Install app dependencies
COPY package*.json ./

# If you are building your code for production use --only=production
RUN npm install

COPY . .

RUN npx tsc

# Stage 1
FROM node:14-alpine

WORKDIR /minecraft-bds-bridge

COPY --from=build-stage /minecraft-bds-bridge/dist /minecraft-bds-bridge
COPY package*.json ./
RUN npm install --only=production

CMD ["node", "main.js"]