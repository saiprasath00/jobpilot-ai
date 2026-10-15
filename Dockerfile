FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps chromium
COPY public ./public
COPY lib ./lib
COPY server.mjs ./server.mjs
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
