FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js config.json ./
COPY public ./public
COPY src ./src
COPY data ./data

ENV NODE_ENV=production
ENV NO_TUNNEL=1
ENV HOST=0.0.0.0
ENV PORT=3000
ENV RDM_USER_DATA=/app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
