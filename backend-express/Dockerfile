FROM node:18-alpine

ENV NODE_ENV=production
ENV DATABASE_URL=file:./dev.db
ENV JWT_SECRET=supersecretjwtkeyforexpressapplicaton54321!
ENV PORT=3000

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
