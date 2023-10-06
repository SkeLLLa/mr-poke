# syntax=docker/dockerfile:1.4
FROM node:lts

WORKDIR /opt/service
COPY . .
EXPOSE 3000
CMD ["node", "-r", "source-map-support/register", "dist/bin/server.js"]
