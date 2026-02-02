FROM oven/bun:1.2

WORKDIR /frontend

COPY package.json bun.lock ./

RUN bun install

COPY . .

ENV HOST=0.0.0.0

EXPOSE 5173

# Vite requires the --host flag to be accessible from outside the container
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]