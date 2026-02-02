FROM oven/bun:1.2

WORKDIR /backend

# Copy only dependency files first to leverage Docker layer caching
COPY package.json bun.lock ./

RUN bun install

# Copy the rest of the source code
COPY . .

ENV PORT=4000 NODE_ENV=development

EXPOSE 4000

CMD ["bun", "run", "dev"]