FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure upload directory exists inside the image (and as the mount target)
RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]
