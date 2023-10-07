# syntax=docker/dockerfile:1.4
FROM node:18

WORKDIR /opt/service
COPY . .
EXPOSE 3000
# CMD ["node", "-r", "source-map-support/register", "dist/bin/server.js"]
CMD ["npm", "run", "start:prod"]
