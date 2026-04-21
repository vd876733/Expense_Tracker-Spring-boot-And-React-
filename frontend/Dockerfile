FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY public ./public
COPY src ./src
COPY .env.production ./.env.production
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
