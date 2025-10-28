# Backend – Project

## Description

Backend service built with [NestJS](https://github.com/nestjs/nest) (TypeScript).

## Requirements

- Node.js version 20.x or later  
- **npm** or **yarn**  
- **Docker** + **Docker Compose**  
- **Prisma CLI**
  ```bash
  npm install -g prisma
  ```

## Mandatory prerequisites

Before running the backend, make sure the following requirements are completed:

1. Environment files (`.env`) must be available (provided by the project leads).  
2. Infrastructure must be running via Docker:
   ```bash
   cd infra/docker
   docker compose --env-file .env -f compose.dev.yml up -d
   docker compose --env-file .env -f minio.compose.yml up -d
   ```
3. Create the database in your SQL client (e.g. DBeaver) with these credentials:
   ```
   POSTGRES_USER=app_user
   POSTGRES_PASSWORD=app_pass
   POSTGRES_DB=learning_agent
   ```

👉 The backend will **not** work unless these prerequisites are fulfilled.

---

## Project setup

Move to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```
Generar Prisma:
```bash
prisma generate
```
Si no tienes Prisma global: npm install -g prisma

Run Prisma migrations:
```bash
npx prisma migrate dev
```

---

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

---

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

---

## Deployment

When ready to deploy in production, check the official documentation:  
👉 [NestJS Deployment Guide](https://docs.nestjs.com/deployment)  

You can also use [Mau](https://mau.nestjs.com), the official NestJS platform for AWS deployment:
```bash
npm install -g @nestjs/mau
mau deploy
```
