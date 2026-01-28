FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app/server
COPY server/package.json ./
RUN npm install
COPY server ./
COPY --from=client-builder /app/client/dist /app/client/dist
ENV PORT=4000
ENV CLIENT_ORIGIN=http://localhost:4000
EXPOSE 4000
CMD ["node", "src/index.js"]
