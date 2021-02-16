FROM node:14-alpine as build

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build:prod

FROM nginx:stable-alpine

COPY --from=build /app/dist/angular-webrtc /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
