# === STAGE 1: Build the Application ===
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency files first (optimizes build caching)
COPY package*.json ./
RUN npm install

# Copy source code and Prisma schemas
COPY . .

# Generate the Prisma client and build typescript files
RUN npx prisma generate
RUN npm run build

# === STAGE 2: Lightweight Production Runner ===
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV=production

# Copy only the compiled javascript output, prisma files, and package configurations
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose the port your Express server listens on (4000)
EXPOSE 4000

# Start the server directly from the compiled server directory
CMD ["node", "dist/server/index.js"]
